// server/routes/authRoutes.js
import express from 'express';

// Controllers & Middlewares
import verifyToken from '../middleware/authMiddleware.js';
import { loginLimiter, forgotPasswordLimiter, resetPasswordLimiter } from '../middleware/rateLimiter.js';
import authController from '../controllers/authController.js';

const router = express.Router();

// Routes
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.me);

// Password Reset Routes
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.get('/verify-reset-token/:token', authController.verifyResetToken);
router.post('/reset-password', resetPasswordLimiter, authController.resetPassword);

export default router;