// server/routes/settingRoutes.js
import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import checkRole from '../middleware/rbacMiddleware.js';
import systemSettingController from '../controllers/systemSettingController.js';

const router = express.Router();

// Public / Authenticated route: Get Contact Info (Phone, WhatsApp URL, Email, Hours)
router.get('/contact', systemSettingController.getContactInfo);

// Admin-protected routes: Update Contact Info and System Settings
router.put('/contact', verifyToken, checkRole(['admin']), systemSettingController.updateContactInfo);
router.get('/all', verifyToken, checkRole(['admin']), systemSettingController.getAllSettings);

export default router;
