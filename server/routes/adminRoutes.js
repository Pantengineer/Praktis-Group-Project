// server/routes/adminRoutes.js
import express from 'express';

// Controllers & Middlewares
import adminController from '../controllers/adminController.js';
import verifyToken from '../middleware/authMiddleware.js';
import checkRole from '../middleware/rbacMiddleware.js';

const router = express.Router();

// ==========================================
// FEATURE 1: DASHBOARD STATS
// ==========================================
router.get('/stats', verifyToken, checkRole(['admin']), adminController.getDashboardStats);

// 1. Get Storage Stats (Capacity & Usage Breakdown)
router.get('/storage-stats', verifyToken, checkRole(['admin']), adminController.getStorageStats);

// 2. Get All Files (Unified File Explorer List)
router.get('/files', verifyToken, checkRole(['admin']), adminController.getAllFiles);

router.delete('/files/:category/:id/:fileIndex', verifyToken, checkRole(['admin', 'asdos', 'mahasiswa']), adminController.deleteFileHandler);

router.delete('/files/:category/:id', verifyToken, checkRole(['admin', 'asdos', 'mahasiswa']), adminController.deleteFileHandler);

// ==========================================
// FEATURE 1.6: ACTIVE IP SESSIONS & IP BAN MANAGEMENT
// ==========================================

// 1. Get Active Sessions (Last active within 60 mins)
router.get('/active-sessions', verifyToken, checkRole(['admin']), adminController.getActiveSessions);

// 2. Get Banned IPs List
router.get('/banned-ips', verifyToken, checkRole(['admin']), adminController.getBannedIps);

// 3. Ban IP Address
router.post('/ban-ip', verifyToken, checkRole(['admin']), adminController.banIp);

// 4. Unban IP Address
router.post('/unban-ip', verifyToken, checkRole(['admin']), adminController.unbanIp);

// ==========================================
// FEATURE 2: MANAJEMEN ASDOS (Direct Assignment)
// ==========================================

// 1. Get Asdos List for a specific Class
router.get('/asdos', verifyToken, checkRole(['admin']), adminController.getAsdos);

// 2. Assign Student as Asdos (Create)
router.post('/asdos', verifyToken, checkRole(['admin']), adminController.assignAsdos);

// 3. Remove Asdos (Delete)
router.delete('/asdos', verifyToken, checkRole(['admin']), adminController.removeAsdos);

// ==========================================
// FEATURE 2.5: MANAJEMEN MAHASISWA PRAKTIKUM
// ==========================================

// 1. Assign Student to Praktikum (Create)
router.post('/mahasiswa_praktikum', verifyToken, checkRole(['admin']), adminController.assignMahasiswaToPraktikum);

// 2. Remove Student from Praktikum (Delete)
router.delete('/mahasiswa_praktikum', verifyToken, checkRole(['admin']), adminController.removeMahasiswaFromPraktikum);

// ==========================================
// FEATURE 3: USER CRUD
// ==========================================

// Get All Users (with pagination — 2.9)
router.get('/users', verifyToken, checkRole(['admin']), adminController.getAllUsers);

// Create New User
router.post('/users', verifyToken, checkRole(['admin']), adminController.createUser);

// Delete User
router.delete('/users/:id', verifyToken, checkRole(['admin']), adminController.deleteUser);

// ==========================================
// FEATURE 3: MANAJEMEN PRAKTIKUM (Master Data)
// ==========================================

// 1. Get All Praktikum (with pagination - 2.9)
router.get('/praktikum', verifyToken, checkRole(['admin']), adminController.getAllPraktikum);

// 2. Create New Praktikum
// POST Create Class + AUTO-GENERATE 10 SESSIONS
router.post('/praktikum', verifyToken, checkRole(['admin']), adminController.createPraktikum);

// 3. Update Praktikum (Fix BG-2: this route was missing)
// PUT /admin/praktikum/:id
router.put('/praktikum/:id', verifyToken, checkRole(['admin']), adminController.updatePraktikum);

// 4. Delete Praktikum
router.delete('/praktikum/:id', verifyToken, checkRole(['admin']), adminController.deletePraktikum);

// 5. GET /admin/api-logs — Paginated API request logs per IP
router.get('/api-logs', verifyToken, checkRole(['admin']), adminController.getApiLogs);

// 6. GET /admin/api-traffic-stats — Time-Windowed Traffic & Bandwidth Aggregation
router.get('/api-traffic-stats', verifyToken, checkRole(['admin']), adminController.getApiTrafficStats);

export default router;