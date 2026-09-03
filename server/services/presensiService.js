// server/services/presensiService.js
import { Presensi, PresensiStatus, Pertemuan, Praktikum, PraktikumUserRole, Role, User } from '../models/sql/index.js';

const getSessionAttendance = async (id_pertemuan) => {
    const session = await Pertemuan.findByPk(id_pertemuan, {
      include: [{ model: Praktikum }]
    });
    if (!session) throw { message: 'Session not found' };;

    const mahasiswaRole = await Role.findOne({ where: { deskripsi: 'mahasiswa' } });
    const enrolled = await PraktikumUserRole.findAll({
      where: { id_praktikum: session.id_praktikum, id_role: mahasiswaRole.id_role },
      include: [{ model: User, attributes: ['id_user', 'nama', 'nim'] }]
    });

    const existingRecords = await Presensi.findAll({
      where: { id_pertemuan },
      include: [{ model: PresensiStatus }]
    });
    const recordMap = {};
    existingRecords.forEach(r => { recordMap[r.id_user] = r; });

    const statuses = await PresensiStatus.findAll();

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

    return {
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
    };
};

const submitAttendance = async ({ id_pertemuan, records }) => {
    if (!records || !Array.isArray(records) || records.length === 0) {
      throw { message: 'records array is required' };;
    }

    const session = await Pertemuan.findByPk(id_pertemuan);
    if (!session) throw { message: 'Session not found' };;

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

    return { message: `${results.length} attendance record(s) saved.`, data: results };
}

const getMyAttendance = async ({ id_praktikum, id_user }) => {
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

    return {
      summary: { total: sessions.length, hadir, izin, sakit, alpha },
      attendance
    };

}

const getStatuses = async () => {
    const statuses = await PresensiStatus.findAll();
    return statuses;
}

export default {
  getSessionAttendance,
  submitAttendance,
  getMyAttendance,
  getStatuses,
}