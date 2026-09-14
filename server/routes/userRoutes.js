// server/routes/userRoutes.js
import express from 'express';
import { PraktikumUserRole, Role } from '../models/sql/index.js';

// Controllers & Middlewares
import userController from '../controllers/userController.js';
import checkRole from '../middleware/rbacMiddleware.js';
import verifyToken from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply Auth Middleware
router.use(verifyToken);

// 1. Profile
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// 2a. Per-class role check (used by asdos SessionDetail to guard manual URL access)
router.get('/my-class-role/:id_praktikum', userController.getMyClassRole);

// 2. Dashboards
router.get('/asdos-dashboard', userController.getAsdosDashboard);
router.get('/mahasiswa-dashboard', userController.getMahasiswaDashboard);

export default router;