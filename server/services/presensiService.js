import { Op } from "sequelize";

import {
  Presensi,
  PresensiStatus,
  Pertemuan,
  Praktikum,
  PraktikumUserRole,
  Role,
  User,
} from "../models/sql/index.js";

// ========================================
// GET ATTENDANCE BY SESSION
// ========================================

const getSessionAttendance = async (id_pertemuan) => {
  const session = await Pertemuan.findByPk(id_pertemuan, {
    include: [{ model: Praktikum }],
  });

  if (!session) {
    throw { message: "Session not found" };
  }

  const mahasiswaRole = await Role.findOne({
    where: { deskripsi: "mahasiswa" },
  });

  const enrolled = await PraktikumUserRole.findAll({
    where: {
      id_praktikum: session.id_praktikum,
      id_role: mahasiswaRole.id_role,
    },
    include: [
      {
        model: User,
        attributes: ["id_user", "nama", "nim"],
      },
    ],
  });

  const existingRecords = await Presensi.findAll({
    where: { id_pertemuan },
    include: [{ model: PresensiStatus }],
  });

  const recordMap = {};

  existingRecords.forEach((record) => {
    recordMap[record.id_user] = record;
  });

  const statuses = await PresensiStatus.findAll();

  const sheet = enrolled.map((enrollment) => ({
    id_user: enrollment.User.id_user,
    nama: enrollment.User.nama,
    nim: enrollment.User.nim,
    presensi: recordMap[enrollment.User.id_user]
      ? {
          id_presensi: recordMap[enrollment.User.id_user].id_presensi,
          id_status: recordMap[enrollment.User.id_user].id_status,
          status_label:
            recordMap[enrollment.User.id_user].PresensiStatus?.status || "-",
          last_updated: recordMap[enrollment.User.id_user].last_updated,
        }
      : null,
  }));

  return {
    session: {
      id_pertemuan: session.id_pertemuan,
      sesi_ke: session.sesi_ke,
      tanggal: session.tanggal,
      waktu_mulai: session.waktu_mulai,
      waktu_selesai: session.waktu_selesai,
      mata_kuliah: session.Praktikum?.mata_kuliah,
    },
    statuses,
    attendance: sheet,
  };
};

// ========================================
// SUBMIT ATTENDANCE
// ========================================

const submitAttendance = async ({ id_pertemuan, records }) => {
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw { message: "records array is required" };
  }

  const session = await Pertemuan.findByPk(id_pertemuan);

  if (!session) {
    throw { message: "Session not found" };
  }

  const results = await Promise.all(
    records.map(async ({ id_user, id_status }) => {
      const [record, created] = await Presensi.findOrCreate({
        where: {
          id_pertemuan,
          id_user,
        },
        defaults: {
          id_pertemuan,
          id_user,
          id_status,
          last_updated: new Date(),
        },
      });

      if (!created) {
        record.id_status = id_status;
        record.last_updated = new Date();
        await record.save();
      }

      return record;
    }),
  );

  return {
    message: `${results.length} attendance record(s) saved.`,
    data: results,
  };
};

// ========================================
// GET STUDENT ATTENDANCE
// ========================================

const getMyAttendance = async ({ id_praktikum, id_user }) => {
  const sessions = await Pertemuan.findAll({
    where: { id_praktikum },
    order: [["sesi_ke", "ASC"]],
  });

  const records = await Presensi.findAll({
    where: { id_user },
    include: [{ model: PresensiStatus }],
  });

  const recordMap = {};

  records.forEach((record) => {
    recordMap[record.id_pertemuan] = record;
  });

  const attendance = sessions.map((session) => ({
    id_pertemuan: session.id_pertemuan,
    sesi_ke: session.sesi_ke,
    tanggal: session.tanggal,
    waktu_mulai: session.waktu_mulai,
    waktu_selesai: session.waktu_selesai,
    status:
      recordMap[session.id_pertemuan]?.PresensiStatus?.status ||
      "Belum Dicatat",
    id_status: recordMap[session.id_pertemuan]?.id_status || null,
  }));

  const hadir = attendance.filter((item) => item.status === "Hadir").length;

  const izin = attendance.filter((item) => item.status === "Izin").length;

  const sakit = attendance.filter((item) => item.status === "Sakit").length;

  const alpha = attendance.filter((item) =>
    ["alpha", "alfa", "alpa"].includes(item.status?.toLowerCase()),
  ).length;

  return {
    summary: {
      total: sessions.length,
      hadir,
      izin,
      sakit,
      alpha,
    },
    attendance,
  };
};

// ========================================
// GET ATTENDANCE STATUSES
// ========================================

const getStatuses = async () => {
  return await PresensiStatus.findAll();
};

// ========================================
// CSV HELPERS
// ========================================

// UTF-8 BOM is included for Excel compatibility.
// Quote cells and neutralize spreadsheet formula prefixes.
const csvCell = (value) => {
  let text = String(value ?? "");

  if (/^[\s\uFEFF]*[=+@-]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

const toCsv = (rows) => {
  return (
    "\uFEFF" +
    rows.map((row) => row.map(csvCell).join(",")).join("\r\n") +
    "\r\n"
  );
};

// ========================================
// GET EXPORT DATA
// ========================================

const getExportData = async (id_praktikum, id_pertemuan = null) => {
  const praktikum = await Praktikum.findByPk(id_praktikum);

  if (!praktikum) {
    const error = new Error("Praktikum tidak ditemukan");
    error.status = 404;
    throw error;
  }

  const sessionWhere = { id_praktikum };

  if (id_pertemuan) {
    sessionWhere.id_pertemuan = id_pertemuan;
  }

  const sessions = await Pertemuan.findAll({
    where: sessionWhere,
    order: [
      ["sesi_ke", "ASC"],
      ["id_pertemuan", "ASC"],
    ],
  });

  if (id_pertemuan && sessions.length === 0) {
    const error = new Error("Sesi tidak ditemukan pada praktikum ini");
    error.status = 404;
    throw error;
  }

  const mahasiswaRole = await Role.findOne({
    where: { deskripsi: "mahasiswa" },
  });

  if (!mahasiswaRole) {
    throw new Error("Role mahasiswa tidak ditemukan");
  }

  const enrollments = await PraktikumUserRole.findAll({
    where: {
      id_praktikum,
      id_role: mahasiswaRole.id_role,
    },
    include: [
      {
        model: User,
        attributes: ["id_user", "nama", "nim"],
      },
    ],
  });

  // Remove duplicate students
  const studentsMap = new Map();

  for (const enrollment of enrollments) {
    if (enrollment.User) {
      studentsMap.set(String(enrollment.User.id_user), enrollment.User);
    }
  }

  const students = [...studentsMap.values()].sort(
    (a, b) =>
      String(a.nim ?? "").localeCompare(String(b.nim ?? ""), "id") ||
      String(a.nama ?? "").localeCompare(String(b.nama ?? ""), "id"),
  );

  const statuses = await PresensiStatus.findAll();

  const statusById = new Map(
    statuses.map((status) => [String(status.id_status), status.status]),
  );

  const sessionIds = sessions.map((session) => session.id_pertemuan);

  const records = sessionIds.length
    ? await Presensi.findAll({
        where: {
          id_pertemuan: {
            [Op.in]: sessionIds,
          },
        },
        order: [
          ["last_updated", "ASC"],
          ["id_presensi", "ASC"],
        ],
      })
    : [];

  const recordsByKey = new Map();

  for (const record of records) {
    recordsByKey.set(`${record.id_pertemuan}:${record.id_user}`, record);
  }

  const resolveStatus = (student, session) => {
    const record = recordsByKey.get(
      `${session.id_pertemuan}:${student.id_user}`,
    );

    return record
      ? statusById.get(String(record.id_status)) || "Status Tidak Dikenal"
      : "Belum Dicatat";
  };

  return {
    praktikum,
    sessions,
    students,
    resolveStatus,
  };
};

// ========================================
// EXPORT CSV BY SESSION
// ========================================

const exportSessionCsv = async (id_pertemuan) => {
  const session = await Pertemuan.findByPk(id_pertemuan);

  if (!session) {
    const error = new Error("Sesi tidak ditemukan");
    error.status = 404;
    throw error;
  }

  const { praktikum, sessions, students, resolveStatus } = await getExportData(
    session.id_praktikum,
    id_pertemuan,
  );

  const current = sessions[0];

  const rows = [
    [
      "NIM",
      "Nama Mahasiswa",
      "Mata Kuliah",
      "Kode Kelas",
      "Sesi",
      "Tanggal",
      "Status Kehadiran",
    ],
    ...students.map((student) => [
      student.nim,
      student.nama,
      praktikum.mata_kuliah,
      praktikum.kode_kelas,
      current.sesi_ke,
      current.tanggal,
      resolveStatus(student, current),
    ]),
  ];

  return {
    csv: toCsv(rows),
    filename: `presensi_sesi_${id_pertemuan}.csv`,
  };
};

// ========================================
// EXPORT CSV REKAP PRAKTIKUM
// ========================================

const exportPraktikumCsv = async (id_praktikum) => {
  const { praktikum, sessions, students, resolveStatus } =
    await getExportData(id_praktikum);

  const rows = [
    [
      "NIM",
      "Nama Mahasiswa",
      "Mata Kuliah",
      "Kode Kelas",
      ...sessions.map(
        (session) => `Sesi ${session.sesi_ke} (${session.tanggal})`,
      ),
      "Total Hadir",
      "Total Izin",
      "Total Sakit",
      "Total Alpa",
      "Belum Dicatat",
    ],
  ];

  for (const student of students) {
    const labels = sessions.map((session) => resolveStatus(student, session));

    const counts = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpa: 0,
      belum: 0,
    };

    for (const label of labels) {
      const normal = String(label).trim().toLowerCase();

      if (normal === "hadir") {
        counts.hadir++;
      } else if (normal === "izin") {
        counts.izin++;
      } else if (normal === "sakit") {
        counts.sakit++;
      } else if (["alpa", "alfa", "alpha"].includes(normal)) {
        counts.alpa++;
      } else if (normal === "belum dicatat") {
        counts.belum++;
      }
    }

    rows.push([
      student.nim,
      student.nama,
      praktikum.mata_kuliah,
      praktikum.kode_kelas,
      ...labels,
      counts.hadir,
      counts.izin,
      counts.sakit,
      counts.alpa,
      counts.belum,
    ]);
  }

  return {
    csv: toCsv(rows),
    filename: `rekap_presensi_praktikum_${id_praktikum}.csv`,
  };
};

export default {
  getSessionAttendance,
  submitAttendance,
  getMyAttendance,
  getStatuses,
  exportSessionCsv,
  exportPraktikumCsv,
};
