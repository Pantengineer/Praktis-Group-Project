import presensiService from "../services/presensiService.js";
import { Pertemuan, PraktikumUserRole, Role } from "../models/sql/index.js";

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

    const result = await presensiService.submitAttendance({
      id_pertemuan,
      records,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const { id_praktikum } = req.params;
    const id_user = req.user.id;

    const result = await presensiService.getMyAttendance({
      id_praktikum,
      id_user,
    });

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

// Helper for sending CSV as downloadable attachment
const sendCsv = (res, { csv, filename }) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");

  res.status(200).send(csv);
};

// Validate export access
// Admin: all practical classes
// Asdos: assigned practical classes only
const ensureExportAccess = async (req, id_praktikum) => {
  if (req.user.roles?.includes("admin")) {
    return true;
  }

  const asdosRole = await Role.findOne({
    where: { deskripsi: "asdos" },
  });

  if (!asdosRole) return false;

  const enrollment = await PraktikumUserRole.findOne({
    where: {
      id_praktikum,
      id_user: req.user.id,
      id_role: asdosRole.id_role,
    },
  });

  return Boolean(enrollment);
};

// Export attendance for a selected session
const exportSessionCsv = async (req, res, next) => {
  try {
    const { id_pertemuan } = req.params;

    const session = await Pertemuan.findByPk(id_pertemuan);

    if (!session) {
      return res.status(404).json({
        message: "Sesi tidak ditemukan",
      });
    }

    const hasAccess = await ensureExportAccess(req, session.id_praktikum);

    if (!hasAccess) {
      return res.status(403).json({
        message: "Tidak memiliki akses ke praktikum ini",
      });
    }

    const result = await presensiService.exportSessionCsv(id_pertemuan);

    return sendCsv(res, result);
  } catch (error) {
    next(error);
  }
};

// Export attendance recap for all sessions
const exportPraktikumCsv = async (req, res, next) => {
  try {
    const { id_praktikum } = req.params;

    const hasAccess = await ensureExportAccess(req, id_praktikum);

    if (!hasAccess) {
      return res.status(403).json({
        message: "Tidak memiliki akses ke praktikum ini",
      });
    }

    const result = await presensiService.exportPraktikumCsv(id_praktikum);

    return sendCsv(res, result);
  } catch (error) {
    next(error);
  }
};

export default {
  getSessionAttendance,
  submitAttendance,
  getMyAttendance,
  getStatuses,
  exportSessionCsv,
  exportPraktikumCsv,
};
