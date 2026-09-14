import { Role, Praktikum, PraktikumUserRole, User, Pertemuan } from '../../models/sql/index.js';

const getAllPraktikum = async ({ page, limit }) => {
    const offset = (page - 1) * limit;

    const { count, rows: labs } = await Praktikum.findAndCountAll({
      order: [['tahun_pelajaran', 'DESC'], ['semester', 'ASC']],
      include: [
        {
          model: PraktikumUserRole,
          required: false,
          include: [
            { model: User, attributes: ['id_user', 'nama', 'nim'] },
            { model: Role, attributes: ['deskripsi'] }
          ]
        }
      ],
      distinct: true,
      limit,
      offset
    });

    const formattedLabs = labs.map(lab => {
      const labJson = lab.toJSON();
      const asdosList = [];
      const studentList = [];

      if (labJson.PraktikumUserRoles) {
        labJson.PraktikumUserRoles.forEach(pur => {
          if (pur.Role?.deskripsi === 'asdos') asdosList.push(pur);
          if (pur.Role?.deskripsi === 'mahasiswa') studentList.push(pur);
        });
      }

      labJson.asdosCount = asdosList.length;
      labJson.studentCount = studentList.length;
      // Overwrite with only asdos to not break existing frontend logic that expects this
      labJson.PraktikumUserRoles = asdosList;

      return labJson;
    });

    return { total: count, page, limit, data: formattedLabs };
};

const createPraktikum = async ({ mata_kuliah, kode_kelas, tahun_pelajaran, sks, semester, ruangan, tanggal_mulai, waktu_mulai, waktu_selesai }) => {

    // Validation
    if (!tanggal_mulai || !waktu_mulai || !waktu_selesai) {
      throw {
        status: 400,
        message: 'Start Date (tanggal_mulai) and Times (waktu_mulai/selesai) are required to generate sessions.'
      };
    }

    // 2. Create the Class (Praktikum)
    // We construct a descriptive string for 'jadwal' based on the input
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const startObj = new Date(tanggal_mulai);
    const dayName = days[startObj.getDay()];
    const jadwalStr = `${dayName}, ${waktu_mulai} - ${waktu_selesai}`;

    const newClass = await Praktikum.create({
      mata_kuliah,
      kode_kelas,
      tahun_pelajaran,
      sks,
      semester,
      ruangan,
      jadwal: jadwalStr
    });

    // 3. AUTO-GENERATE 10 SESSIONS (Pertemuan)
    const sessions = [];
    for (let i = 0; i < 10; i++) {
      // Calculate date: Start Date + (Week * 7 days)
      const sessionDate = new Date(tanggal_mulai);
      sessionDate.setDate(sessionDate.getDate() + (i * 7));

      sessions.push({
        id_praktikum: newClass.id_praktikum,
        sesi_ke: i + 1,
        tanggal: sessionDate,       // YYYY-MM-DD
        waktu_mulai: waktu_mulai,   // HH:MM
        waktu_selesai: waktu_selesai, // HH:MM
        ruangan: ruangan
      });
    }

    // Bulk insert for performance
    await Pertemuan.bulkCreate(sessions);

    return {
      status: 201,
      message: 'Class and 10 Sessions created successfully!',
      data: newClass,
    };
};

const updatePraktikum = async ({ id, mata_kuliah, kode_kelas, tahun_pelajaran, sks, semester, ruangan }) => {

    // 2.3: Basic input validation
    if (!mata_kuliah || !tahun_pelajaran) {
      throw { status: 400, message: 'mata_kuliah and tahun_pelajaran are required.' };
    }
    if (sks && (isNaN(sks) || sks < 1 || sks > 6)) {
      throw { status: 400, message: 'sks must be a number between 1 and 6.' };
    }
    if (semester && (isNaN(semester) || semester < 1 || semester > 14)) {
      throw { status: 400, message: 'semester must be between 1 and 14.' };
    }

    const lab = await Praktikum.findByPk(id);
    if (!lab) throw { status: 404, message: 'Praktikum not found.' };

    // Only update provided fields
    if (mata_kuliah) lab.mata_kuliah = mata_kuliah;
    if (kode_kelas) lab.kode_kelas = kode_kelas;
    if (tahun_pelajaran) lab.tahun_pelajaran = tahun_pelajaran;
    if (sks) lab.sks = sks;
    if (semester) lab.semester = semester;
    if (ruangan) lab.ruangan = ruangan;

    await lab.save();
    return { message: 'Praktikum updated successfully.', data: lab };
};

const deletePraktikum = async (id_praktikum) => {
    // Optional: Check if Asdos are assigned before deleting to prevent orphan data
    await Praktikum.destroy({ where: { id_praktikum } });
    return { message: 'Praktikum deleted' };
};

export default {
  getAllPraktikum,
  createPraktikum,
  updatePraktikum,
  deletePraktikum,
};