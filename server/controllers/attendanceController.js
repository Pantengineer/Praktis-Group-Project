// server/controllers/attendanceController.js
// 2.8: Full attendance (Presensi) CRUD — activates the dormant Presensi model.
import { Presensi, PresensiStatus, Pertemuan, Praktikum, PraktikumUserRole, Role, User } from '../models/sql/index.js';

// ============================================================
// GET /api/attendance/session/:id_pertemuan
// Asdos: Get attendance sheet for a session (all enrolled students + their status)
// ============================================================
async function getSessionAttendance(req, res, next) {
  try {
    const { id_pertemuan } = req.params;

    // 1. Verify session exists and get the praktikum ID
    const session = await Pertemuan.findByPk(id_pertemuan, {
      include: [{ model: Praktikum }]
    });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // 2. Get all students enrolled in this praktikum
    const mahasiswaRole = await Role.findOne({ where: { deskripsi: 'mahasiswa' } });
    const enrolled = await PraktikumUserRole.findAll({
      where: { id_praktikum: session.id_praktikum, id_role: mahasiswaRole.id_role },
      include: [{ model: User, attributes: ['id_user', 'nama', 'nim'] }]
    });

    // 3. Get existing attendance records for this session
    const existingRecords = await Presensi.findAll({
      where: { id_pertemuan },
      include: [{ model: PresensiStatus }]
    });
    const recordMap = {};
    existingRecords.forEach(r => { recordMap[r.id_user] = r; });

    // 4. Get all possible statuses
    const statuses = await PresensiStatus.findAll();

    // 5. Merge: for each enrolled student, attach their current status (or null if not recorded)
    const sheet = enrolled.map(e => ({
      id_user: e.User.id_user,
      nama: e.User.nama,
      nim: e.User.nim,
      presensi: recordMap[e.User.id_user]
        ? {
          id_presensi: recordMap[e.User.id_user].id_presensi,
          id_status: recordMap[e.User.id_user].id_status,
          status_label: recordMap[e.User.id_user].PresensiStatus?.status || '-',
          last_updated: recordMap[e.User.id_user].last_updated
        }
        : null
    }));

    res.json({
      session: {
        id_pertemuan: session.id_pertemuan,
        sesi_ke: session.sesi_ke,
        tanggal: session.tanggal,
        waktu_mulai: session.waktu_mulai,
        waktu_selesai: session.waktu_selesai,
        mata_kuliah: session.Praktikum?.mata_kuliah
      },
      statuses,
      attendance: sheet
    });

  } catch (error) {
    next(error);
  }
}

// ============================================================
// POST /api/attendance/session/:id_pertemuan
// Asdos: Submit/update attendance for one or more students in bulk
// Body: { records: [{ id_user, id_status }, ...] }
// ============================================================
async function submitAttendance(req, res, next) {
  try {
    const { id_pertemuan } = req.params;
    const { records } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'records array is required' });
    }

    // Validate session exists
    const session = await Pertemuan.findByPk(id_pertemuan);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Upsert each record
    const results = await Promise.all(
      records.map(async ({ id_user, id_status }) => {
        const [record, created] = await Presensi.findOrCreate({
          where: { id_pertemuan, id_user },
          defaults: { id_pertemuan, id_user, id_status, last_updated: new Date() }
        });
        if (!created) {
          record.id_status = id_status;
          record.last_updated = new Date();
          await record.save();
        }
        return record;
      })
    );

    res.json({ message: `${results.length} attendance record(s) saved.`, data: results });

  } catch (error) {
    next(error);
  }
}

// ============================================================
// GET /api/attendance/my/:id_praktikum
// Mahasiswa: View their own attendance for all sessions of a class
// ============================================================
async function getMyAttendance(req, res, next) {
  try {
    const { id_praktikum } = req.params;
    const id_user = req.user.id;

    // Get all sessions for this praktikum (ordered)
    const sessions = await Pertemuan.findAll({
      where: { id_praktikum },
      order: [['sesi_ke', 'ASC']]
    });

    // Get attendance records for this student
    const records = await Presensi.findAll({
      where: { id_user },
      include: [{ model: PresensiStatus }]
    });
    const recordMap = {};
    records.forEach(r => { recordMap[r.id_pertemuan] = r; });

    // Merge
    const attendance = sessions.map(s => ({
      id_pertemuan: s.id_pertemuan,
      sesi_ke: s.sesi_ke,
      tanggal: s.tanggal,
      waktu_mulai: s.waktu_mulai,
      waktu_selesai: s.waktu_selesai,
      status: recordMap[s.id_pertemuan]?.PresensiStatus?.status || 'Belum Dicatat',
      id_status: recordMap[s.id_pertemuan]?.id_status || null
    }));

    // Summary stats
    const hadir = attendance.filter(a => a.status === 'Hadir').length;
    const izin = attendance.filter(a => a.status === 'Izin').length;
    const sakit = attendance.filter(a => a.status === 'Sakit').length;
    const alpha = attendance.filter(a => ['alpha', 'alfa', 'alpa'].includes(a.status?.toLowerCase())).length;

    res.json({
      summary: { total: sessions.length, hadir, izin, sakit, alpha },
      attendance
    });

  } catch (error) {
    next(error);
  }
}

// ============================================================
// GET /api/attendance/statuses
// Get all available attendance statuses (for dropdowns)
// ============================================================
async function getStatuses(req, res, next) {
  try {
    const statuses = await PresensiStatus.findAll();
    res.json(statuses);
  } catch (error) {
    next(error);
  }
}

export {
  getSessionAttendance,
  submitAttendance,
  getMyAttendance,
  getStatuses,
}