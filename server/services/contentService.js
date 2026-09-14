// server/services/contentService.js
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';

import Tugas from '../models/nosql/Tugas.js';
import Materi from '../models/nosql/Materi.js';
import Pengumpulan from '../models/nosql/Pengumpulan.js';
import { Pertemuan, Praktikum, PraktikumUserRole, Role, Presensi } from '../models/sql/index.js';

// 1. Create a Session (Schedule)
const createSession = async ({ id_praktikum, sesi_ke, tanggal, waktu_mulai, waktu_selesai, ruangan, userId, isAdmin }) => {
  let isAuthorized = isAdmin;

  if (!isAdmin) {
    const isAsdos = await PraktikumUserRole.findOne({
      where: { id_praktikum, id_user: userId },
      include: [{ model: Role, where: { deskripsi: 'asdos' } }]
    });
    if (isAsdos) isAuthorized = true;
  }

  if (!isAuthorized) throw { status: 403, message: 'Forbidden: You are not the Asdos for this class.' };

  // Create the session in SQL
  const newSession = await Pertemuan.create({
    id_praktikum,
    sesi_ke,
    tanggal,
    waktu_mulai,
    waktu_selesai,
    ruangan
  });

  return { status: 201, message: 'Session created', data: newSession };
};

// 2. Get All Sessions (Timeline)
const getSessionsByClass = async (id_praktikum) => {
  const sessions = await Pertemuan.findAll({
    where: { id_praktikum },
    order: [['sesi_ke', 'ASC']]
  });
  return sessions;
};

// 2b. Get Single Class Info (for header banners)
const getClassInfo = async (id_praktikum) => {
  const cls = await Praktikum.findByPk(id_praktikum);
  if (!cls) throw { status: 404, message: 'Kelas tidak ditemukan' };
  return { classInfo: cls };
};

// 3. Delete Session — with cascade to MongoDB documents (2.6: orphan prevention)
const deleteSession = async (id_pertemuan) => {
  // 1. Validate the session exists
  const session = await Pertemuan.findByPk(id_pertemuan);
  if (!session) throw { status: 404, message: 'Session not found' };

  // 2. Cascade: delete all MongoDB documents linked to this session
  //    This fixes the referential integrity gap in the hybrid SQL/MongoDB design.
  const tasksToDelete = await Tugas.find({ pertemuan_id: Number(id_pertemuan) });
  const taskIds = tasksToDelete.map(t => t._id);

  // Delete all submissions for these tasks
  if (taskIds.length > 0) {
    await Pengumpulan.deleteMany({ tugas_id: { $in: taskIds } });
  }
  // Delete the tasks themselves
  await Tugas.deleteMany({ pertemuan_id: Number(id_pertemuan) });
  // Delete all materials for this session
  await Materi.deleteMany({ pertemuan_id: Number(id_pertemuan) });
  // Delete attendance records for this session
  await Presensi.destroy({ where: { id_pertemuan: id_pertemuan } });

  // 3. Finally destroy the SQL session row
  await Pertemuan.destroy({ where: { id_pertemuan: id_pertemuan } });

  return { message: 'Session and all associated content deleted successfully.' };
};

// ==========================================
// B. CONTENT MANAGEMENT (NoSQL)
// ==========================================

// 4. Create Task (Tugas)
const createTask = async ({ pertemuan_id, judul, deskripsi, tenggat_waktu, userId, files }) => {
  // Validate
  if (!pertemuan_id || !judul || !tenggat_waktu) throw { status: 400, message: 'Missing fields' };

  const deadline = new Date(tenggat_waktu);
  if (isNaN(deadline.getTime())) throw { status: 400, message: 'Invalid deadline' };

  const attachments = files.map(f => ({
    filename: f.filename, path: f.path, mimetype: f.mimetype, size: f.size
  }));

  const newTask = await Tugas.create({
    pertemuan_id, judul, deskripsi, tenggat_waktu: deadline,
    created_by: userId, attachments
  });

  return { status: 201, message: 'Task created', data: newTask };
};

// 5. Create Material (Materi)
const createMaterial = async ({ pertemuan_id, judul, deskripsi, files = [], userId }) => {
  const attachments = files.map(f => ({
    filename: f.filename, path: f.path, mimetype: f.mimetype, size: f.size
  }));

  const newMaterial = await Materi.create({
    pertemuan_id, judul, deskripsi, attachments,
    created_by: userId
  });

  return { status: 201, message: 'Material uploaded', data: newMaterial };
};

// 6. Getters 
const getTasksBySession = async (pertemuan_id) => {
  const tasks = await Tugas.find({ pertemuan_id: Number(pertemuan_id) });
  return tasks;
};

const getMaterialsBySession = async (pertemuan_id) => {
  const materials = await Materi.find({ pertemuan_id: Number(pertemuan_id) });
  return materials;
};

// 7. Download Material File
const downloadMaterialFile = async ({ materiId, fileIndex, isView }) => {
  const material = await Materi.findById(materiId);
  if (!material) throw { status: 404, message: 'Material not found' };

  const file = material.attachments[parseInt(fileIndex)];
  if (!file) throw { status: 404, message: 'File not found' };

  const normalizedDbPath = file.path.replace(/\\/g, '/');
  const filePath = path.resolve(path.join(import.meta.dirname, '..', normalizedDbPath));
  const uploadsRoot = path.resolve(path.join(import.meta.dirname, '..', 'uploads'));

  if (!filePath.startsWith(uploadsRoot + path.sep) && filePath !== uploadsRoot) {
    throw { status: 403, message: 'Access denied: invalid file path' };
  }

  if (!fs.existsSync(filePath)) throw { status: 404, message: 'File not found on server' };

  const isInline = isView === 'true' || isView === true;
  const mimeType = (file.mimetype && file.mimetype !== 'application/octet-stream')
    ? file.mimetype
    : undefined;

  const cleanDownloadName = file.filename ? file.filename.replace(/^\d+-\d+-(?:\d+-)?/, '') : 'materi-download';

  return {
    isInline,
    mimeType,
    filePath,
    downloadFileName: cleanDownloadName,
    fileSize: file.size,
    stream: fs.createReadStream(filePath),
  };
};

// NEW: Update Session (Reschedule)
const updateSession = async ({ pertemuan_id, tanggal, waktu_mulai, waktu_selesai, ruangan, isAdmin, userId }) => {
  const session = await Pertemuan.findByPk(pertemuan_id);
  if (!session) throw { status: 404, message: 'Session not found' };

  if (!isAdmin) {
    const isAsdos = await PraktikumUserRole.findOne({
      where: { id_praktikum: session.id_praktikum, id_user: userId },
      include: [{ model: Role, where: { deskripsi: 'asdos' } }]
    });
    if (!isAsdos) throw { status: 403, message: 'Forbidden: You are not the Asdos for this class.' };
  }

  // 3. Update Fields (only update fields that are actually sent)
  if (tanggal) session.tanggal = tanggal;
  if (waktu_mulai) session.waktu_mulai = waktu_mulai;
  if (waktu_selesai) session.waktu_selesai = waktu_selesai;
  if (ruangan) session.ruangan = ruangan;

  await session.save();

  return { message: 'Session updated successfully', data: session };
};

// NEW: Get Single Task by ID
const getTaskById = async (tugas_id) => {
  const task = await Tugas.findById(tugas_id);
  if (!task) throw { status: 404, message: 'Task not found' };
  return task;
};

const getSessionById = async (pertemuan_id) => {
  const session = await Pertemuan.findByPk(pertemuan_id);
  if (!session) throw { status: 404, message: 'Session not found' };
  return session;
};

const downloadTaskAttachment = async ({ tugas_id, index, isView }) => {
  const task = await Tugas.findById(tugas_id);
  if (!task || !task.attachments || !task.attachments[index]) {
    throw { status: 404, message: 'File not found' };
  }

  const file = task.attachments[index];
  const normalizedDbPath = file.path.replace(/\\/g, '/');
  const filePath = path.resolve(path.join(import.meta.dirname, '..', normalizedDbPath));
  const uploadsRoot = path.resolve(path.join(import.meta.dirname, '..', 'uploads'));

  if (!filePath.startsWith(uploadsRoot + path.sep) && filePath !== uploadsRoot) {
    throw { status: 403, message: 'Access denied: invalid file path' };
  }

  if (!fs.existsSync(filePath)) {
    throw { status: 404, message: 'File not found on server' };
  }

  const isInline = isView === 'true' || isView === true;
  const mimeType = (file.mimetype && file.mimetype !== 'application/octet-stream')
    ? file.mimetype
    : undefined;

  const cleanTaskFileName = file.filename ? file.filename.replace(/^\d+-\d+-(?:\d+-)?/, '') : 'soal-download';

  return {
    isInline,
    mimeType,
    filePath,
    downloadFileName: cleanTaskFileName,
  }
};

// NEW: User Timeline Across All Enrolled Classes
const getUserTimeline = async ({ userId, roles = [] }) => {
  const isAdmin = roles.includes('admin');
  const roleByClass = {};

  if (isAdmin) {
    const allClasses = await Praktikum.findAll({ attributes: ['id_praktikum'] });
    allClasses.forEach(c => { roleByClass[c.id_praktikum] = 'admin'; });
  } else {
    // Fetch all role definitions to build a stable id->name map
    const allRoles = await Role.findAll({ attributes: ['id_role', 'deskripsi'] });
    const roleNameById = {};
    allRoles.forEach(r => { roleNameById[r.id_role] = r.deskripsi; });

    const enrollments = await PraktikumUserRole.findAll({
      where: { id_user: userId },
      attributes: ['id_praktikum', 'id_role']
    });

    enrollments.forEach(e => {
      const roleName = roleNameById[e.id_role] || 'mahasiswa';
      const existing = roleByClass[e.id_praktikum];
      // If a user has multiple rows for the same class, prefer asdos over mahasiswa
      if (!existing || roleName === 'asdos') {
        roleByClass[e.id_praktikum] = roleName;
      }
    });
  }

  const classIds = Object.keys(roleByClass).map(Number);

  if (classIds.length === 0) return { timeline: [] };

  // Fetch all sessions for these classes
  const sessions = await Pertemuan.findAll({
    where: { id_praktikum: { [Op.in]: classIds } },
    include: [
      {
        model: Praktikum,
        attributes: ['id_praktikum', 'mata_kuliah', 'kode_kelas', 'ruangan']
      }
    ],
    order: [['tanggal', 'ASC'], ['waktu_mulai', 'ASC']]
  });

  const sessionIds = sessions.map(s => s.id_pertemuan);

  // Fetch materials & tasks count for these sessions in parallel
  const [allMaterials, allTasks] = await Promise.all([
    Materi.find({ pertemuan_id: { $in: sessionIds } }).select('pertemuan_id _id judul attachments deskripsi'),
    Tugas.find({ pertemuan_id: { $in: sessionIds } }).select('pertemuan_id _id judul tenggat_waktu deskripsi attachments')
  ]);

  const materialsBySession = {};
  allMaterials.forEach(m => {
    const pid = m.pertemuan_id;
    if (!materialsBySession[pid]) materialsBySession[pid] = [];
    materialsBySession[pid].push(m);
  });

  const tasksBySession = {};
  allTasks.forEach(t => {
    const pid = t.pertemuan_id;
    if (!tasksBySession[pid]) tasksBySession[pid] = [];
    tasksBySession[pid].push(t);
  });

  // Map into chronological timeline items, including per-class role
  const timeline = sessions.map(s => {
    const mats = materialsBySession[s.id_pertemuan] || [];
    const tsks = tasksBySession[s.id_pertemuan] || [];

    return {
      id_pertemuan: s.id_pertemuan,
      id_praktikum: s.id_praktikum,
      sesi_ke: s.sesi_ke,
      tanggal: s.tanggal,
      waktu_mulai: s.waktu_mulai,
      waktu_selesai: s.waktu_selesai,
      ruangan: s.ruangan || s.Praktikum?.ruangan,
      mata_kuliah: s.Praktikum?.mata_kuliah || 'Praktikum',
      kode_kelas: s.Praktikum?.kode_kelas || 'A',
      // Per-class role: the role this user holds specifically in this class
      user_role: roleByClass[s.id_praktikum] || 'mahasiswa',
      materialsCount: mats.length,
      tasksCount: tsks.length,
      materials: mats,
      tasks: tsks
    };
  });

  return { timeline };
};

export default {
  createSession,
  getSessionsByClass,
  getClassInfo,
  deleteSession,
  createTask,
  createMaterial,
  getTasksBySession,
  getMaterialsBySession,
  downloadMaterialFile,
  updateSession,
  getTaskById,
  getSessionById,
  downloadTaskAttachment,
  getUserTimeline,
}