// server/controllers/userController.js
import userService from '../services/userService.js';

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // From authMiddleware

    const result = await userService.getProfile(userId);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getMyClassRole = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id_praktikum } = req.params;

    if (req.user.roles?.includes('admin')) {
      return res.json({ role: 'admin' });
    }

    const role = await userService.getMyClassRole({ userId, id_praktikum });

    return res.json({ role });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { nama, email, nim, prodi, angkatan, password } = req.body;

    const result = await userService.updateProfile({ userId, nama, email, nim, prodi, angkatan, password });

    return res.status(200).json(result)
  } catch (error) {
    next(error);
  }
};

// =========================================================
// ASDOS DASHBOARD
// =========================================================
const getAsdosDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await userService.getAsdosDashboard(userId);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// =========================================================
// MAHASISWA DASHBOARD
// =========================================================
const getMahasiswaDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await userService.getMahasiswaDashboard(userId);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// =========================================================
// ADMIN: Get Specific User Details + Enrollments
// =========================================================
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await userService.getUserById(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateUserByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nama, email, nim, prodi, angkatan } = req.body;

    const result = await userService.updateUserByAdmin({ id, nama, email, nim, prodi, angkatan });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  getMyClassRole,
  updateProfile,
  getAsdosDashboard,
  getMahasiswaDashboard,
  getUserById,
  updateUserByAdmin,
}