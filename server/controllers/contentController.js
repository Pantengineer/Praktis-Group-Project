// server/controllers/contentController.js
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';

import Tugas from '../models/nosql/Tugas.js';
import Materi from '../models/nosql/Materi.js';
import Pengumpulan from '../models/nosql/Pengumpulan.js';
import { Pertemuan, Praktikum, PraktikumUserRole, Role, Presensi } from '../models/sql/index.js';

// 1. Create a Session (Schedule)
const createSession = async (req, res, next) => {
  try {
    const { id_praktikum, sesi_ke, tanggal, waktu_mulai, waktu_selesai, ruangan } = req.body;
    const userId = req.user.id;

    // Security Check: Is this user the Asdos for this class?
    // (Or is it an Admin?)
    const isAdmin = req.user.roles.includes('admin');
    let isAuthorized = isAdmin;

    if (!isAdmin) {
      const isAsdos = await PraktikumUserRole.findOne({
        where: { id_praktikum, id_user: userId },
        include: [{ model: Role, where: { deskripsi: 'asdos' } }]
      });
      if (isAsdos) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Forbidden: You are not the Asdos for this class.' });
    }

    // Create the session in SQL
    const newSession = await Pertemuan.create({
      id_praktikum,
      sesi_ke,
      tanggal,
      waktu_mulai,
      waktu_selesai,
      ruangan
    });

    res.status(201).json({ message: 'Session created', data: newSession });
  } catch (error) {
    next(error);
  }
};

// 2. Get All Sessions (Timeline)
const getSessionsByClass = async (req, res, next) => {
  try {
    const { id_praktikum } = req.params;
    const sessions = await Pertemuan.findAll({
      where: { id_praktikum },
      order: [['sesi_ke', 'ASC']]
    });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

// 2b. Get Single Class Info (for header banners)
const getClassInfo = async (req, res, next) => {
  try {
    const { id_praktikum } = req.params;
    const cls = await Praktikum.findByPk(id_praktikum);
    if (!cls) return res.status(404).json({ message: 'Kelas tidak ditemukan' });
    res.json({ classInfo: cls });
  } catch (error) {
    next(error);
  }
};

// 3. Delete Session — with cascade to MongoDB documents (2.6: orphan prevention)
const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Validate the session exists
    const session = await Pertemuan.findByPk(id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // 2. Cascade: delete all MongoDB documents linked to this session
    //    This fixes the referential integrity gap in the hybrid SQL/MongoDB design.
    const tasksToDelete = await Tugas.find({ pertemuan_id: Number(id) });
    const taskIds = tasksToDelete.map(t => t._id);

    // Delete all submissions for these tasks
    if (taskIds.length > 0) {
      await Pengumpulan.deleteMany({ tugas_id: { $in: taskIds } });
    }
    // Delete the tasks themselves
    await Tugas.deleteMany({ pertemuan_id: Number(id) });
    // Delete all materials for this session
    await Materi.deleteMany({ pertemuan_id: Number(id) });
    // Delete attendance records for this session
    await Presensi.destroy({ where: { id_pertemuan: id } });

    // 3. Finally destroy the SQL session row
    await Pertemuan.destroy({ where: { id_pertemuan: id } });

    res.json({ message: 'Session and all associated content deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// B. CONTENT MANAGEMENT (NoSQL)
// ==========================================

// 4. Create Task (Tugas)
const createTask = async (req, res, next) => {
  try {
    const { pertemuan_id, judul, deskripsi, tenggat_waktu } = req.body;

    // Validate
    if (!pertemuan_id || !judul || !tenggat_waktu) return res.status(400).json({ message: 'Missing fields' });

    const deadline = new Date(tenggat_waktu);
    if (isNaN(deadline.getTime())) return res.status(400).json({ message: 'Invalid deadline' });

    // Handle Attachments
    const files = req.files || [];
    const attachments = files.map(f => ({
      filename: f.filename, path: f.path, mimetype: f.mimetype, size: f.size
    }));

    const newTask = await Tugas.create({
      pertemuan_id, judul, deskripsi, tenggat_waktu: deadline,
      created_by: req.user.id, attachments
    });

    res.status(201).json({ message: 'Task created', data: newTask });
  } catch (error) { next(error); }
};

// 5. Create Material (Materi)
const createMaterial = async (req, res, next) => {
  try {
    const { pertemuan_id, judul, deskripsi } = req.body;
    const files = req.files || [];

    const attachments = files.map(f => ({
      filename: f.filename, path: f.path, mimetype: f.mimetype, size: f.size
    }));

    const newMaterial = await Materi.create({
      pertemuan_id, judul, deskripsi, attachments,
      created_by: req.user.id
    });

    res.status(201).json({ message: 'Material uploaded', data: newMaterial });
  } catch (error) { next(error); }
};

// 6. Getters 
const getTasksBySession = async (req, res, next) => {
  try {
    const { pertemuan_id } = req.params;
    const tasks = await Tugas.find({ pertemuan_id });
    res.json(tasks);
  } catch (error) { next(error); }
};

const getMaterialsBySession = async (req, res, next) => {
  try {
    const { pertemuan_id } = req.params;
    const materials = await Materi.find({ pertemuan_id });
    res.json(materials);
  } catch (error) { next(error); }
};

// 7. Download Material File
const downloadMaterialFile = async (req, res, next) => {
  try {
    const { materiId, fileIndex } = req.params;
    const material = await Materi.findById(materiId);

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const file = material.attachments[parseInt(fileIndex)];
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // 1. Normalize path separators (fixes Windows backslashes if moved to Linux)
    const normalizedDbPath = file.path.replace(/\\/g, '/');

    // 2. Resolve absolute path
    const filePath = path.resolve(path.join(import.meta.dirname, '..', normalizedDbPath));

    // Security fix (SV-9): Path traversal guard.
    // Ensure the resolved path is within the expected uploads directory.
    const uploadsRoot = path.resolve(path.join(import.meta.dirname, '..', 'uploads'));
    if (!filePath.startsWith(uploadsRoot + path.sep) && filePath !== uploadsRoot) {
      return res.status(403).json({ message: 'Access denied: invalid file path' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    if (req.query.view === 'true') {
      const mimeType = (file.mimetype && file.mimetype !== 'application/octet-stream') 
        ? file.mimetype 
        : undefined;

      return res.sendFile(filePath, {
        headers: {
          ...(mimeType ? { 'Content-Type': mimeType } : {}),
          'Content-Disposition': 'inline'
        }
      });
    }

    // Set Headers
    const cleanDownloadName = file.filename ? file.filename.replace(/^\d+-\d+-(?:\d+-)?/, '') : 'materi-download';
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${cleanDownloadName}"`);
    res.setHeader('Content-Length', file.size);

    // Create Stream with error handling before headers are sent
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      // Only send error response if headers haven't been sent yet
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      } else {
        res.destroy();
      }
    });
    stream.pipe(res);

  } catch (error) {
    next(error);
  }
};

// ==========================================
// NEW: Update Session (Reschedule)
// ==========================================
const updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tanggal, waktu_mulai, waktu_selesai, ruangan } = req.body;

    // 1. Find the Session
    const session = await Pertemuan.findByPk(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // 2. Security fix (SV-8): Authorization check — only the assigned Asdos or Admin can edit.
    const isAdmin = req.user.roles.includes('admin');
    if (!isAdmin) {
      const isAsdos = await PraktikumUserRole.findOne({
        where: { id_praktikum: session.id_praktikum, id_user: req.user.id },
        include: [{ model: Role, where: { deskripsi: 'asdos' } }]
      });
      if (!isAsdos) {
        return res.status(403).json({ message: 'Forbidden: You are not the Asdos for this class.' });
      }
    }

    // 3. Update Fields (only update fields that are actually sent)
    if (tanggal) session.tanggal = tanggal;
    if (waktu_mulai) session.waktu_mulai = waktu_mulai;
    if (waktu_selesai) session.waktu_selesai = waktu_selesai;
    if (ruangan) session.ruangan = ruangan;

    await session.save();

    res.json({ message: 'Session updated successfully', data: session });

  } catch (error) {
    next(error);
  }
};

// NEW: Get Single Task by ID
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Tugas.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
};

const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await Pertemuan.findByPk(id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    next(err);
  }
};

const downloadTaskAttachment = async (req, res) => {
  try {
    const { id, index } = req.params;
    
    const task = await Tugas.findById(id);
    if (!task || !task.attachments || !task.attachments[index]) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = task.attachments[index];

    // 1. NORMALIZE PATH (Fix Windows backslashes)
    const normalizedDbPath = file.path.replace(/\\/g, '/');

    // 2. RESOLVE PATH
    const filePath = path.resolve(path.join(import.meta.dirname, '..', normalizedDbPath));

    // Security fix (SV-9): Path traversal guard.
    const uploadsRoot = path.resolve(path.join(import.meta.dirname, '..', 'uploads'));
    if (!filePath.startsWith(uploadsRoot + path.sep) && filePath !== uploadsRoot) {
      return res.status(403).json({ message: 'Access denied: invalid file path' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found on server' });
    }
    
    if (req.query.view === 'true') {
      const mimeType = (file.mimetype && file.mimetype !== 'application/octet-stream') 
        ? file.mimetype 
        : undefined;

      return res.sendFile(filePath, {
        headers: {
          ...(mimeType ? { 'Content-Type': mimeType } : {}),
          'Content-Disposition': 'inline'
        }
      });
    }
    
    const cleanTaskFileName = file.filename ? file.filename.replace(/^\d+-\d+-(?:\d+-)?/, '') : 'soal-download';
    res.download(filePath, cleanTaskFileName);

  } catch (error) {
    console.error("Download Error:", error);
    res.status(500).json({ message: 'Error downloading file' });
  }
};

// NEW: User Timeline Across All Enrolled Classes
const getUserTimeline = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('admin');

    // Build a map of id_praktikum -> role_name for this user's enrollments
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

    if (classIds.length === 0) {
      return res.json({ timeline: [] });
    }

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

    res.json({ timeline });

  } catch (error) {
    console.error("Timeline Error:", error);
    next(error);
  }
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