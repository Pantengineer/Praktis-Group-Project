import express from 'express';

import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import contentRoutes from './contentRoutes.js';
import submissionRoutes from './submissionRoutes.js';
import userRoutes from './userRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/content', contentRoutes);
router.use('/submission', submissionRoutes);
router.use('/users', userRoutes);
router.use('/attendance', attendanceRoutes);

export default router;