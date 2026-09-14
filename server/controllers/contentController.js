// server/controllers/contentController.js
import contentService from '../services/contentService.js';

// 1. Create a Session (Schedule)
const createSession = async (req, res, next) => {
  try {
    const { id_praktikum, sesi_ke, tanggal, waktu_mulai, waktu_selesai, ruangan } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');

    const result = await contentService.createSession({ id_praktikum, sesi_ke, tanggal, waktu_mulai, waktu_selesai, ruangan, userId, isAdmin });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// 2. Get All Sessions (Timeline)
const getSessionsByClass = async (req, res, next) => {
  try {
    const { id_praktikum } = req.params;
    const sessions = await contentService.getSessionsByClass(id_praktikum);
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

// 2b. Get Single Class Info (for header banners)
const getClassInfo = async (req, res, next) => {
  try {
    const { id_praktikum } = req.params;
    const result = await contentService.getClassInfo(id_praktikum);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 3. Delete Session — with cascade to MongoDB documents (2.6: orphan prevention)
const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await contentService.deleteSession(id);
    res.json(result);
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
    const userId = req.user.id;
    const files = req.files || [];

    const result = await contentService.createTask({ pertemuan_id, judul, deskripsi, tenggat_waktu, userId, files });

    res.status(201).json(result);
  } catch (error) { next(error); }
};

// 5. Create Material (Materi)
const createMaterial = async (req, res, next) => {
  try {
    const { pertemuan_id, judul, deskripsi } = req.body;
    const files = req.files || [];
    const userId = req.user.id;

    const result = await contentService.createMaterial({ pertemuan_id, judul, deskripsi, files, userId });

    res.status(201).json(result);
  } catch (error) { next(error); }
};

// 6. Getters 
const getTasksBySession = async (req, res, next) => {
  try {
    const { pertemuan_id } = req.params;
    const tasks = await contentService.getTasksBySession(pertemuan_id);
    res.json(tasks);
  } catch (error) { next(error); }
};

const getMaterialsBySession = async (req, res, next) => {
  try {
    const { pertemuan_id } = req.params;
    const materials = await contentService.getMaterialsBySession(pertemuan_id);
    res.json(materials);
  } catch (error) { next(error); }
};

// 7. Download Material File
const downloadMaterialFile = async (req, res, next) => {
  try {
    const { materiId, fileIndex } = req.params;
    const isView = req.query.view;

    const filePayload = await contentService.downloadMaterialFile({ materiId, fileIndex, isView });

    if (filePayload.isInline) {
      return res.sendFile(filePayload.filePath, {
        headers: {
          ...(filePayload.mimeType ? { 'Content-Type': filePayload.mimeType } : {}),
          'Content-Disposition': 'inline'
        }
      });
    }

    res.setHeader('Content-Type', filePayload.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filePayload.downloadFileName}"`);
    res.setHeader('Content-Length', filePayload.fileSize);

    // Create Stream with error handling before headers are sent
    filePayload.stream.on('error', (err) => {
      console.error('Stream error:', err);
      // Only send error response if headers haven't been sent yet
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      } else {
        res.destroy();
      }
    });
    filePayload.stream.pipe(res);

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
    const isAdmin = req.user.roles.includes('admin');
    const userId = req.user.id;

    const result = await contentService.updateSession({ pertemuan_id: id, tanggal, waktu_mulai, waktu_selesai, ruangan, isAdmin, userId });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// NEW: Get Single Task by ID
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await contentService.getTaskById(id);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await contentService.getSessionById(id);
    res.json(session);
  } catch (err) {
    next(err);
  }
};

const downloadTaskAttachment = async (req, res) => {
  try {
    const { id, index } = req.params;
    const isView = req.query.view;

    const filePayload = await contentService.downloadTaskAttachment({ tugas_id: id, index, isView });

    if (filePayload.isInline) {
      return res.sendFile(filePayload.filePath, {
        headers: {
          ...(filePayload.mimeType ? { 'Content-Type': filePayload.mimeType } : {}),
          'Content-Disposition': 'inline'
        }
      });
    }

    res.download(filePayload.filePath, filePayload.downloadFileName);
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

    const { timeline } = await contentService.getUserTimeline({ userId, roles });

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