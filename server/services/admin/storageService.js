import fs from 'node:fs';
import path from 'node:path';

import { Pertemuan, Praktikum, User, PraktikumUserRole, Role } from '../../models/sql/index.js';
import Materi from '../../models/nosql/Materi.js';
import Tugas from '../../models/nosql/Tugas.js';
import Pengumpulan from '../../models/nosql/Pengumpulan.js';

import { getFolderSize } from '../../utils/fileHelper.js';

const safeUnlink = async (relativeFilePath) => {
  if (!relativeFilePath) return;
  const absolutePath = path.join(import.meta.dirname, '../..', relativeFilePath);
  try {
    await fs.unlink(absolutePath);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(`Failed to delete: ${absolutePath}`, err);
  }
};

const isStaffUser = async (user) => {
  const rawRoles = user.roles || (user.role ? [user.role] : []);
  const rolesList = Array.isArray(rawRoles) ? rawRoles.map(r => String(r).toLowerCase()) : [String(rawRoles).toLowerCase()];

  if (rolesList.some(r => r === 'asdos' || r === 'admin')) {
    return true;
  }

  const userId = user.id;
  const staffEnrollment = await PraktikumUserRole.findOne({
    where: { id_user: userId },
    include: [{
      model: Role,
      where: { deskripsi: ['asdos', 'admin'] }
    }]
  });

  return !!staffEnrollment;
};

const getStorageStats = async () => {
  const maxStorageMB = parseInt(process.env.MAX_STORAGE_LIMIT_MB) || 5000; // Default 5 GB
  const maxStorageBytes = maxStorageMB * 1024 * 1024;

  // Fetch DB documents
  const [materis, tugass, pengumpulans] = await Promise.all([
    Materi.find({}, { attachments: 1 }).lean(),
    Tugas.find({}, { attachments: 1 }).lean(),
    Pengumpulan.find({}, { file: 1 }).lean(),
  ]);

  let materiBytes = 0;
  let materiCount = 0;
  materis.forEach(m => {
    if (m.attachments) {
      m.attachments.forEach(att => {
        materiBytes += (att.size || 0);
        materiCount++;
      });
    }
  });

  let tugasBytes = 0;
  let tugasCount = 0;
  tugass.forEach(t => {
    if (t.attachments) {
      t.attachments.forEach(att => {
        tugasBytes += (att.size || 0);
        tugasCount++;
      });
    }
  });

  let pengumpulanBytes = 0;
  let pengumpulanCount = 0;
  pengumpulans.forEach(p => {
    if (p.file) {
      pengumpulanBytes += (p.file.size || 0);
      pengumpulanCount++;
    }
  });

  // Also verify disk folder usage
  const uploadsDir = path.join(import.meta.dirname, '../../uploads');
  const diskTotalBytes = getFolderSize(uploadsDir);
  const dbTotalBytes = materiBytes + tugasBytes + pengumpulanBytes;

  // Use whichever is higher (disk or calculated DB bytes) to prevent overflow hiding
  const totalUsedBytes = Math.max(diskTotalBytes, dbTotalBytes);
  const totalUsedMB = parseFloat((totalUsedBytes / (1024 * 1024)).toFixed(2));
  const usedPercentage = parseFloat(((totalUsedBytes / maxStorageBytes) * 100).toFixed(1));

  return {
    maxStorageMB,
    maxStorageBytes,
    totalUsedBytes,
    totalUsedMB,
    usedPercentage,
    totalFiles: materiCount + tugasCount + pengumpulanCount,
    categories: {
      materi: {
        bytes: materiBytes,
        mb: parseFloat((materiBytes / (1024 * 1024)).toFixed(2)),
        count: materiCount
      },
      tugas: {
        bytes: tugasBytes,
        mb: parseFloat((tugasBytes / (1024 * 1024)).toFixed(2)),
        count: tugasCount
      },
      pengumpulan: {
        bytes: pengumpulanBytes,
        mb: parseFloat((pengumpulanBytes / (1024 * 1024)).toFixed(2)),
        count: pengumpulanCount
      }
    }
  };
};

const getAllFiles = async () => {
  const [materis, tugass, pengumpulans] = await Promise.all([
    Materi.find({}).sort({ created_at: -1 }).lean(),
    Tugas.find({}).sort({ created_at: -1 }).lean(),
    Pengumpulan.find({}).sort({ submitted_at: -1 }).lean(),
  ]);

  // Gather session IDs & user IDs for SQL bulk lookup
  const sessionIds = new Set();
  const userIds = new Set();

  materis.forEach(m => {
    if (m.pertemuan_id) sessionIds.add(m.pertemuan_id);
    if (m.created_by) userIds.add(m.created_by);
  });

  tugass.forEach(t => {
    if (t.pertemuan_id) sessionIds.add(t.pertemuan_id);
    if (t.created_by) userIds.add(t.created_by);
  });

  pengumpulans.forEach(p => {
    if (p.student_id) userIds.add(p.student_id);
  });

  // Lookup SQL Sessions and Users
  const sessions = await Pertemuan.findAll({
    where: { id_pertemuan: Array.from(sessionIds) },
    include: [{ model: Praktikum, attributes: ['id_praktikum', 'kode_kelas', 'mata_kuliah'] }]
  });

  const users = await User.findAll({
    where: { id_user: Array.from(userIds) },
    attributes: ['id_user', 'nama', 'nim', 'email']
  });

  const sessionMap = {};
  sessions.forEach(s => { sessionMap[s.id_pertemuan] = s; });

  const userMap = {};
  users.forEach(u => { userMap[u.id_user] = u; });

  // Map Tugas by ObjectId to resolve Pengumpulan session
  const tugasMap = {};
  tugass.forEach(t => { tugasMap[t._id.toString()] = t; });

  const fileList = [];

  // Map Materials
  materis.forEach(m => {
    const session = sessionMap[m.pertemuan_id];
    const uploader = userMap[m.created_by];

    if (m.attachments && m.attachments.length > 0) {
      m.attachments.forEach((att, idx) => {
        fileList.push({
          id: m._id,
          fileIndex: idx,
          category: 'materi',
          filename: att.filename,
          path: att.path,
          mimetype: att.mimetype,
          size: att.size || 0,
          title: m.judul,
          pertemuan_id: m.pertemuan_id,
          sesi_ke: session?.sesi_ke,
          kode_kelas: session?.Praktikum?.kode_kelas || 'N/A',
          mata_kuliah: session?.Praktikum?.mata_kuliah || 'N/A',
          uploadedBy: uploader ? uploader.nama : 'System/Unknown',
          uploaderNim: uploader?.nim || '-',
          createdAt: m.created_at || m.createdAt
        });
      });
    }
  });

  // Map Tasks
  tugass.forEach(t => {
    const session = sessionMap[t.pertemuan_id];
    const uploader = userMap[t.created_by];

    if (t.attachments && t.attachments.length > 0) {
      t.attachments.forEach((att, idx) => {
        fileList.push({
          id: t._id,
          fileIndex: idx,
          category: 'tugas',
          filename: att.filename,
          path: att.path,
          mimetype: att.mimetype,
          size: att.size || 0,
          title: t.judul,
          pertemuan_id: t.pertemuan_id,
          sesi_ke: session?.sesi_ke,
          kode_kelas: session?.Praktikum?.kode_kelas || 'N/A',
          mata_kuliah: session?.Praktikum?.mata_kuliah || 'N/A',
          uploadedBy: uploader ? uploader.nama : 'System/Unknown',
          uploaderNim: uploader?.nim || '-',
          createdAt: t.created_at || t.createdAt
        });
      });
    }
  });

  // Map Student Submissions
  pengumpulans.forEach(p => {
    const parentTask = tugasMap[p.tugas_id?.toString()];
    const session = parentTask ? sessionMap[parentTask.pertemuan_id] : null;
    const student = userMap[p.student_id];

    if (p.file && p.file.filename) {
      fileList.push({
        id: p._id,
        fileIndex: 0,
        category: 'pengumpulan',
        filename: p.file.filename,
        path: p.file.path,
        mimetype: p.file.mimetype,
        size: p.file.size || 0,
        title: parentTask ? `Tugas: ${parentTask.judul}` : 'Submission',
        pertemuan_id: parentTask?.pertemuan_id,
        sesi_ke: session?.sesi_ke,
        kode_kelas: session?.Praktikum?.kode_kelas || 'N/A',
        mata_kuliah: session?.Praktikum?.mata_kuliah || 'N/A',
        uploadedBy: student ? student.nama : 'Mahasiswa',
        uploaderNim: student?.nim || '-',
        createdAt: p.submitted_at || p.created_at
      });
    }
  });

  // Sort by Date Descending
  fileList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return { files: fileList };
};

const deleteFile = async ({ category, id, fileIndex = 0, user }) => {
  const idx = parseInt(fileIndex, 10);
  const isStaff = await isStaffUser(user);

  if (category === 'materi') {
    if (!isStaff) throw { status: 403, message: 'Hanya Asdos & Admin yang dapat menghapus materi.' };

    const materi = await Materi.findById(id);
    if (!materi) throw { status: 404, message: 'Materi tidak ditemukan' };

    const targetFile = materi.attachments?.[idx];
    if (targetFile) {
      await safeUnlink(targetFile.path);
      materi.attachments.splice(idx, 1);
      materi.attachments.length === 0 ? await Materi.findByIdAndDelete(id) : await materi.save();
    }
  } else if (category === 'tugas') {
    if (!isStaff) throw { status: 403, message: 'Hanya Asdos & Admin yang dapat menghapus tugas.' };
    const tugas = await Tugas.findById(id);
    if (!tugas) throw { status: 404, message: 'Tugas tidak ditemukan' };

    const targetFile = tugas.attachments?.[idx];
    if (targetFile) {
      await safeUnlink(targetFile.path);
      tugas.attachments.splice(idx, 1);
      await tugas.save();
    }
  } else if (category === 'pengumpulan') {
    const submission = await Pengumpulan.findById(id);
    if (!submission) throw { status: 404, message: 'Pengumpulan tidak ditemukan' };

    const userId = user.id;
    const isOwner = submission.student_id?.toString() === userId.toString();

    if (!isOwner && !isStaff) throw { status: 403, message: 'Anda tidak memiliki hak akses untuk menghapus pengumpulan ini.' };

    if (submission.file?.path) await safeUnlink(submission.file.path);
    await Pengumpulan.findByIdAndDelete(id);
  } else {
    throw { status: 400, message: 'Invalid category' };
  }

  return { message: 'Berkas berhasil dihapus dari sistem.' };
};

export default {
  getStorageStats,
  getAllFiles,
  deleteFile,
};