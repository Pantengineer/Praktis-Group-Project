import dashboardService from '../services/admin/dashboardService.js';
import storageService from '../services/admin/storageService.js';
import assignmentService from '../services/admin/assignmentService.js';
import userService from '../services/admin/userService.js';
import securityService from '../services/admin/securityService.js';
import praktikumService from '../services/admin/praktikumService.js';
import monitoringService from '../services/admin/monitoringService.js';

import { extractClientIP } from '../middleware/ipBanMiddleware.js';

const getDashboardStats = async (req, res) => {
  try {
    const dashboardStats = await dashboardService.getDashboardStats();
    res.json(dashboardStats);
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ message: 'Server Error fetching stats' });
  }
};

const getStorageStats = async (req, res) => {
  try {
    const storageStats = await storageService.getStorageStats();
    res.json(storageStats);
  } catch (error) {
    console.error("Storage Stats Error:", error);
    res.status(500).json({ message: 'Error fetching storage statistics' });
  }
};

const getAllFiles = async (req, res) => {
  try {
    const fileList = await storageService.getAllFiles();
    res.json(fileList);
  } catch (error) {
    console.error("Files Explorer Error:", error);
    res.status(500).json({ message: 'Error fetching files list' });
  }
};

const deleteFileHandler = async (req, res) => {
  try {
    const { category, id, fileIndex } = req.params;
    const user = req.user;

    const result = await storageService.deleteFile({ category, id, fileIndex, user });

    res.json(result);
  } catch (error) {
    console.error("Delete File Error:", error);
    res.status(500).json({ message: 'Gagal menghapus berkas' });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const activeSessions = await securityService.getActiveSessions();
    res.json(activeSessions);
  } catch (error) {
    console.error("Active Sessions Error:", error);
    res.status(500).json({ message: 'Error fetching active sessions' });
  }
};

const getBannedIps = async (req, res) => {
  try {
    const bannedIps = await securityService.getBannedIps();
    res.json({ bannedIps });
  } catch (error) {
    console.error("Banned IPs Error:", error);
    res.status(500).json({ message: 'Error fetching banned IPs' });
  }
};

const banIp = async (req, res) => {
  try {
    const { ip_address, reason, durationMinutes, is_permanent } = req.body;
    const adminIP = extractClientIP(req);
    const userId = req.user.id;

    const result = await securityService.banIp({ ip_address, reason, durationMinutes, is_permanent, adminIP, userId });

    res.json(result);
  } catch (error) {
    console.error("Ban IP Error:", error);
    res.status(500).json({ message: 'Gagal memblokir alamat IP.' });
  }
};

const unbanIp = async (req, res) => {
  try {
    const { ip_address } = req.body;

    const result = await securityService.unbanIp(ip_address);

    res.json(result);
  } catch (error) {
    console.error("Unban IP Error:", error);
    res.status(500).json({ message: 'Gagal membuka pemblokiran IP.' });
  }
};

const getAsdos = async (req, res) => {
  try {
    const { id_praktikum } = req.query;

    const asdosList = await assignmentService.getAsdos(id_praktikum);

    res.json(asdosList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching asdos list' });
  }
};

const assignAsdos = async (req, res) => {
  try {
    const { id_user, id_praktikum } = req.body;

    const result = await assignmentService.assignAsdos({ id_user, id_praktikum });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error assigning asdos' });
  }
};

const removeAsdos = async (req, res) => {
  try {
    const { id_user, id_praktikum } = req.body;

    const result = await assignmentService.removeAsdos({ id_user, id_praktikum });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error removing asdos' });
  }
};

const assignMahasiswaToPraktikum = async (req, res) => {
  try {
    const { id_user, id_praktikum } = req.body;

    const result = await assignmentService.assignMahasiswaToPraktikum({ id_user, id_praktikum });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error enrolling student' });
  }
};

const removeMahasiswaFromPraktikum = async (req, res) => {
  try {
    const { id_user, id_praktikum } = req.body;

    const result = await assignmentService.removeMahasiswaFromPraktikum({ id_user, id_praktikum });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error removing student' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);

    const result = await userService.getAllUsers({ page, limit });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const createUser = async (req, res) => {
  try {
    const { nama, nim, email, password, role, prodi, angkatan } = req.body;

    const result = await userService.createUser({ nama, nim, email, password, role, prodi, angkatan });

    res.json(result);
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const result = await userService.deleteUser(userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};

const getAllPraktikum = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);

    const result = await praktikumService.getAllPraktikum({ page, limit });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching labs' });
  }
};

const createPraktikum = async (req, res) => {
  try {
    const {
      mata_kuliah, kode_kelas, tahun_pelajaran,
      sks, semester, ruangan,
      tanggal_mulai, waktu_mulai, waktu_selesai
    } = req.body;

    const result = await praktikumService.createPraktikum({
      mata_kuliah, kode_kelas, tahun_pelajaran,
      sks, semester, ruangan,
      tanggal_mulai, waktu_mulai, waktu_selesai
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating class: ' + err.message });
  }
};

const updatePraktikum = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      mata_kuliah, kode_kelas, tahun_pelajaran,
      sks, semester, ruangan
    } = req.body;

    const result = await praktikumService.updatePraktikum({ id, mata_kuliah, kode_kelas, tahun_pelajaran, sks, semester, ruangan });

    res.json(result);
  } catch (error) {
    console.error('Update Praktikum Error:', error);
    res.status(500).json({ message: 'Error updating praktikum: ' + error.message });
  }
};

const deletePraktikum = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await praktikumService.deletePraktikum(id);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting praktikum' });
  }
};

const getApiLogs = async (req, res) => {
  try {
    const { ip, method, statusCode, page = 1, limit = 25 } = req.query;

    const result = await monitoringService.getApiLogs({ ip, method, statusCode, page, limit });

    res.json(result);
  } catch (error) {
    console.error('Error fetching API logs:', error);
    res.status(500).json({ message: 'Error fetching API logs: ' + error.message });
  }
};

const getApiTrafficStats = async (req, res) => {
  try {
    const { hours } = req.query;

    const result = await monitoringService.getApiTrafficStats(hours);

    res.json(result);
  } catch (error) {
    console.error('Error fetching traffic stats:', error);
    res.status(500).json({ message: 'Error fetching traffic stats: ' + error.message });
  }
};

export default {
  getDashboardStats,
  getStorageStats,
  getAllFiles,
  deleteFileHandler,
  getActiveSessions,
  getBannedIps,
  banIp,
  unbanIp,
  getAsdos,
  assignAsdos,
  removeAsdos,
  assignMahasiswaToPraktikum,
  removeMahasiswaFromPraktikum,
  getAllUsers,
  createUser,
  deleteUser,
  getAllPraktikum,
  createPraktikum,
  updatePraktikum,
  deletePraktikum,
  getApiLogs,
  getApiTrafficStats,
};