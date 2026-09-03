// server/controllers/praktikumController.js
import praktikumService from '../services/praktikumService.js';

import response from '../utils/responseHelper.js';

// 1. Create a new Class (Admin Only)
const createPraktikum = async (req, res) => {
  try {
    const { mata_kuliah, tahun_pelajaran, sks, semester, jadwal, ruangan } = req.body;

    const result = await praktikumService.createPraktikum({ mata_kuliah, tahun_pelajaran, sks, semester, jadwal, ruangan });
 
    response.success(res, 201, result.message, result.data);
  } catch (error) {
    response.error(res, 500, error.message);
  }
};

// 2. Get All Classes (Visible to Admin, later filtered for students)
const getAllPraktikums = async (req, res) => {
  try {
    const result = await praktikumService.getAllPraktikums();
    response.success(res, 200, result.message, result.data);
  } catch (error) {
    response.error(res, 500, error.message);
  }
};

// 3. Enroll a User into a Class (Admin Only)
const enrollUser = async (req, res) => {
  try {
    const { id_praktikum } = req.params;
    const { id_user, role_name } = req.body;

    const result = await praktikumService.enrollUser({ id_praktikum, id_user, role_name });

    response.success(res, 201, result.message);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return response.error(res, 400, 'User is already enrolled in this class');
    }
    response.error(res, 500, error.message);
  }
};

export default {
  createPraktikum,
  getAllPraktikums,
  enrollUser,
};