// server/routes/attendanceRoutes.js
import express from 'express';

// Controllers & Middleware
import verifyToken from '../middleware/authMiddleware.js';
import checkRole from '../middleware/rbacMiddleware.js';
import { getSessionAttendance, submitAttendance, getMyAttendance, getStatuses } from '../controllers/attendanceController.js';

const router = express.Router();

router.use(verifyToken);
router.get('/session/:id_pertemuan', checkRole(['asdos', 'admin']), getSessionAttendance);
router.post('/session/:id_pertemuan', checkRole(['asdos', 'admin']), submitAttendance);

router.get('/my/:id_praktikum', getMyAttendance);
router.get('/statuses', getStatuses);

export default router;