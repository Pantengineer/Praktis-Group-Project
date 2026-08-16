// server/routes/contentRoutes.js
import express from 'express';

// Controllers & Middlewares
import contentController from '../controllers/contentController.js';
import submissionController from '../controllers/submissionController.js';
import verifyToken from '../middleware/authMiddleware.js';
import checkRole from '../middleware/rbacMiddleware.js';
import createUploader from '../middleware/uploadMiddleware.js';
import validateMimeType from '../middleware/validateMimeType.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

// Uploaders
const uploadMaterial = createUploader('materials');
const uploadTask = createUploader('tasks');

const router = express.Router();

router.use(verifyToken);

// Create
router.post('/session',
  checkRole(['asdos', 'admin']),
  contentController.createSession
);

// Read (List)
router.get('/session/list/:id_praktikum',
  contentController.getSessionsByClass
);

router.get('/class-info/:id_praktikum',
  contentController.getClassInfo
);

// Update (Reschedule)
router.put('/session/:id',
  checkRole(['asdos', 'admin']),
  contentController.updateSession
);

// Delete
router.delete('/session/:id',
  checkRole(['asdos', 'admin']),
  contentController.deleteSession
);

// Upload Material
router.post('/materi',
  checkRole(['asdos', 'admin']),
  uploadLimiter,             // Anti-Abuse: Max 10 uploads / 15 mins
  uploadMaterial.array('files', 5),
  validateMimeType,              // 2.7: Validate real MIME via magic bytes
  contentController.createMaterial
);

// Create Task
router.post('/tugas',
  checkRole(['asdos', 'admin']),
  uploadLimiter,             // Anti-Abuse: Max 10 uploads / 15 mins
  uploadTask.array('files', 5),
  validateMimeType,              // 2.7: Validate real MIME via magic bytes
  contentController.createTask
);

// Get Content (Used by Session Detail page later)
router.get('/materi/session/:pertemuan_id', contentController.getMaterialsBySession);
router.get('/tugas/session/:pertemuan_id', contentController.getTasksBySession);

// Download Material File
router.get('/materi/:materiId/download/:fileIndex', contentController.downloadMaterialFile);
router.get('/tugas/:id/download/:index', contentController.downloadTaskAttachment);
router.get('/tugas/:id', contentController.getTaskById);
router.get('/me/:taskId', submissionController.getMySubmission);
router.get('/session/:id', contentController.getSessionById);
router.get('/user-timeline', contentController.getUserTimeline);

export default router;