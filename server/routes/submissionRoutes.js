// server/routes/submissionRoutes.js
import express from 'express';

// Controllers & Middlewares
import submissionController from '../controllers/submissionController.js';
import verifyToken from '../middleware/authMiddleware.js';
import checkRole from '../middleware/rbacMiddleware.js';
import createUploader from '../middleware/uploadMiddleware.js';
import validateMimeType from '../middleware/validateMimeType.js';

// Setup specific uploader for Submissions
import { uploadLimiter } from '../middleware/rateLimiter.js';
const uploadSubmission = createUploader('submissions');

const router = express.Router();

router.use(verifyToken);

/**
 * @route   POST /api/submission
 * @desc    Student submits a file for a Task
 * @access  Authenticated Users (Logic inside controller checks deadline)
 * @body    form-data: { tugas_id: "...", file: [PDF/Doc] }
 */
router.post('/',
  uploadLimiter,                // Anti-Abuse: Max 10 uploads / 15 mins
  uploadSubmission.single('file'),
  validateMimeType,                 // 2.7: Magic bytes check after upload
  submissionController.submitWork
);

/**
 * @route   PUT /api/submission/:submissionId/grade
 * @desc    Asdos grades a submission
 * @access  Asdos or Admin
 */
router.put('/:submissionId/grade',
  checkRole(['asdos', 'admin']),
  submissionController.gradeWork
);

/**
 * @route   GET /api/submission/:submissionId/download
 * @desc    Download the submitted file
 * @access  Authenticated Users (Controller checks ownership)
 */
router.get('/:submissionId/download',
  submissionController.downloadFile
);

router.get('/task/:taskId',
  checkRole(['asdos', 'admin']),
  submissionController.getSubmissionsByTask
);

router.get('/me/:taskId', submissionController.getMySubmission);

router.post('/me/bulk-check', submissionController.getMySubmissionsForTasks);

router.get('/download/:submissionId', verifyToken, submissionController.downloadFile);

router.post('/:submissionId/comment', verifyToken, submissionController.addComment);

router.delete('/:submissionId', verifyToken, submissionController.deleteSubmission);

export default router;