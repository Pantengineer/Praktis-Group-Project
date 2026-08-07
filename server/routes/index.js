const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const contentRoutes = require('./contentRoutes');
const submissionRoutes = require('./submissionRoutes');
const userRoutes = require('./userRoutes');
const attendanceRoutes = require('./attendanceRoutes');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/content', contentRoutes);
router.use('/submission', submissionRoutes);
router.use('/users', userRoutes);
router.use('/attendance', attendanceRoutes);

module.exports = router;