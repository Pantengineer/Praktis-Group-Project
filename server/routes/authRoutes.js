// server/routes/authRoutes.js
import express from 'express';

// Controllers & Middlewares
import authController from '../controllers/authController.js';
import verifyToken from '../middleware/authMiddleware.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Routes
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.me);

export default router;