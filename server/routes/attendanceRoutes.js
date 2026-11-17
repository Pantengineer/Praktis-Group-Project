import express from "express";

import verifyToken from "../middleware/authMiddleware.js";
import checkRole from "../middleware/rbacMiddleware.js";
import attendanceController from "../controllers/attendanceController.js";

const router = express.Router();

router.use(verifyToken);

// Export CSV
router.get(
  "/export/session/:id_pertemuan",
  checkRole(["asdos", "admin"]),
  attendanceController.exportSessionCsv,
);

router.get(
  "/export/praktikum/:id_praktikum",
  checkRole(["asdos", "admin"]),
  attendanceController.exportPraktikumCsv,
);

// Existing attendance endpoints
router.get(
  "/session/:id_pertemuan",
  checkRole(["asdos", "admin"]),
  attendanceController.getSessionAttendance,
);

router.post(
  "/session/:id_pertemuan",
  checkRole(["asdos", "admin"]),
  attendanceController.submitAttendance,
);

router.get("/my/:id_praktikum", attendanceController.getMyAttendance);

router.get("/statuses", attendanceController.getStatuses);

export default router;
