// server/controllers/attendanceController.js
import presensiService from '../services/presensiService.js';

const getSessionAttendance = async (req, res, next) => {
  try {
    const { id_pertemuan } = req.params;

    const result = await presensiService.getSessionAttendance(id_pertemuan);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const submitAttendance = async (req, res, next) => {
  try {
    const { id_pertemuan } = req.params;
    const { records } = req.body;

    const result = await presensiService.submitAttendance({ id_pertemuan, records });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const { id_praktikum } = req.params;
    const id_user = req.user.id;

    const result = await presensiService.getMyAttendance({ id_praktikum, id_user });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getStatuses = async (req, res, next) => {
  try {
    const result = await presensiService.getStatuses();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  getSessionAttendance,
  submitAttendance,
  getMyAttendance,
  getStatuses,
};