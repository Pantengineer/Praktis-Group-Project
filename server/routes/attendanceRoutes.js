// server/routes/attendanceRoutes.js
import express from 'express';

// Controllers & Middleware
import verifyToken from '../middleware/authMiddleware.js';
import checkRole from '../middleware/rbacMiddleware.js';
import attendanceController from '../controllers/attendanceController.js';

const router = express.Router();

router.use(verifyToken);
router.get('/session/:id_pertemuan', checkRole(['asdos', 'admin']), attendanceController.getSessionAttendance);
router.post('/session/:id_pertemuan', checkRole(['asdos', 'admin']), attendanceController.submitAttendance);

router.get('/my/:id_praktikum', attendanceController.getMyAttendance);
router.get('/statuses', attendanceController.getStatuses);

export default router;