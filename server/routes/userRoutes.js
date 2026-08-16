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
router.get('/my-class-role/:id_praktikum', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id_praktikum } = req.params;

    // Global admins always have access
    if (req.user.roles?.includes('admin')) {
      return res.json({ role: 'admin' });
    }

    const allRoles = await Role.findAll({ attributes: ['id_role', 'deskripsi'] });
    const roleNameById = {};
    allRoles.forEach(r => { roleNameById[r.id_role] = r.deskripsi; });

    const enrollment = await PraktikumUserRole.findOne({
      where: { id_user: userId, id_praktikum }
    });

    if (!enrollment) {
      return res.status(403).json({ role: null, message: 'Not enrolled in this class' });
    }

    const role = roleNameById[enrollment.id_role] || 'mahasiswa';
    return res.json({ role });
  } catch (err) {
    console.error('my-class-role error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. Dashboards
router.get('/asdos-dashboard', userController.getAsdosDashboard);
router.get('/mahasiswa-dashboard', userController.getMahasiswaDashboard);

// === ADMIN ROUTES ===
// Get User Details
router.get('/admin/users/:id',
  verifyToken,
  checkRole(['admin']), // Ensure only admin can access
  userController.getUserById
);

// Security fix (BG-5): checkRole(['admin']) added — previously any authenticated user
// could update any other user's profile via this endpoint.
router.put('/admin/users/:id', checkRole(['admin']), userController.updateUserByAdmin);

// Assign Class
router.post('/admin/enroll',
  verifyToken,
  checkRole(['admin']),
  userController.assignUserToClass
);

// Remove Class
router.post('/admin/unenroll',
  verifyToken,
  checkRole(['admin']),
  userController.removeUserFromClass
);

export default router;