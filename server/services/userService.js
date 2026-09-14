// server/services/userService.js
import { Op } from 'sequelize';

import { User, Praktikum, PraktikumUserRole, Role, Pertemuan } from '../models/sql/index.js';
import Tugas from '../models/nosql/Tugas.js';
import Pengumpulan from '../models/nosql/Pengumpulan.js';

import bcrypt from 'bcryptjs';

const getProfile = async (userId) => {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: PraktikumUserRole,
          required: false, // Return user even if no classes
          include: [
            { model: Praktikum },
            { model: Role }
          ]
        }
      ]
    });
    if (!user) throw { status: 404, message: 'User not found' }; 

    const rawRoles = user.PraktikumUserRoles || [];
    const classes = rawRoles.map(pur => ({
      id_praktikum: pur.id_praktikum,
      nama_praktikum: pur.Praktikum ? pur.Praktikum.mata_kuliah : 'Unknown',
      kode_kelas: pur.Praktikum ? pur.Praktikum.kode_kelas : '-',
      role: pur.Role ? pur.Role.deskripsi : 'member',
      tahun: pur.Praktikum ? pur.Praktikum.tahun_pelajaran : '-'
    }));

    return {
      user: {
        id_user: user.id_user,
        nama: user.nama,
        nim: user.nim,
        email: user.email,
        prodi: user.prodi,
        angkatan: user.angkatan,
        created_at: user.created_at
      },
      classes: classes
    };
};

const getMyClassRole = async ({ userId, id_praktikum }) => {
    const allRoles = await Role.findAll({ attributes: ['id_role', 'deskripsi'] });
    const roleNameById = {};
    allRoles.forEach(r => { roleNameById[r.id_role] = r.deskripsi; });

    const enrollment = await PraktikumUserRole.findOne({
      where: { id_user: userId, id_praktikum }
    });
    if (!enrollment) throw { status: 403, role: null, message: 'Not enrolled in this class' };

    const role = roleNameById[enrollment.id_role] || 'mahasiswa';
    return role;
};

const updateProfile = async ({ userId, nama, email, nim, prodi, angkatan, password }) => {
    const user = await User.findByPk(userId);
    if (!user) throw { status: 404, message: 'User not found' };

    if ((email && email !== user.email) || (nim && nim !== user.nim)) {
      const conflict = await User.findOne({
        where: {
          [Op.and]: [
            { id_user: { [Op.ne]: userId } }, // Exclude current user (ID != myID)
            {
              [Op.or]: [
                // Check if new email is taken (ignore if undefined)
                email ? { email: email } : null,
                // Check if new nim is taken (ignore if undefined)
                nim ? { nim: nim } : null
              ].filter(Boolean) // Remove nulls
            }
          ]
        }
      });

      if (conflict) throw { status: 400, message: 'Email atau NIM sudah digunakan oleh user lain.' };
    }

    if (nama) user.nama = nama;
    if (email) user.email = email;
    if (nim) user.nim = nim;
    if (prodi) user.prodi = prodi;
    if (angkatan) user.angkatan = angkatan;

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    const userData = user.toJSON();
    delete userData.password;

    return { success: true, message: 'Profil berhasil diperbarui', data: userData };
};

// =========================================================
// ASDOS DASHBOARD
// =========================================================
const getAsdosDashboard = async (userId) => {
    const assignments = await PraktikumUserRole.findAll({
      where: { id_user: userId },
      include: [
        {
          model: Praktikum,
          attributes: ['id_praktikum', 'mata_kuliah', 'kode_kelas', 'tahun_pelajaran', 'jadwal', 'ruangan']
        },
        {
          model: Role,
          where: { deskripsi: 'asdos' }
        }
      ]
    });

    const teachingClassesRaw = await Promise.all(assignments.map(async (a) => {
      if (!a.Praktikum) return null;

      const id_praktikum = a.Praktikum.id_praktikum;

      const studentCount = await PraktikumUserRole.count({
        where: { id_praktikum },
        include: [{ model: Role, where: { deskripsi: 'mahasiswa' } }]
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let nextSession = await Pertemuan.findOne({
        where: {
          id_praktikum,
          tanggal: { [Op.gte]: today }
        },
        order: [['tanggal', 'ASC']]
      });

      let isPastSession = false;
      if (!nextSession) {
        nextSession = await Pertemuan.findOne({
          where: { id_praktikum },
          order: [['tanggal', 'DESC']]
        });
        if (nextSession) isPastSession = true;
      }

      const sessions = await Pertemuan.findAll({
        where: { id_praktikum },
        attributes: ['id_pertemuan']
      });
      const sessionIds = sessions.map(s => s.id_pertemuan);

      const tasks = await Tugas.find({ pertemuan_id: { $in: sessionIds } }).select('_id');
      const taskIds = tasks.map(t => t._id);

      const ungradedCount = await Pengumpulan.countDocuments({
        tugas_id: { $in: taskIds },
        $or: [{ status: 'diserahkan' }, { nilai: null }]
      });

      return {
        id_praktikum: a.Praktikum.id_praktikum,
        nama_praktikum: a.Praktikum.mata_kuliah,
        kode: a.Praktikum.kode_kelas,
        jadwal: a.Praktikum.jadwal,
        ruangan: a.Praktikum.ruangan,
        tahun_pelajaran: a.Praktikum.tahun_pelajaran,
        studentCount,
        nextSessionDate: nextSession ? nextSession.tanggal : null,
        nextSessionSesiKe: nextSession ? nextSession.sesi_ke : null,
        isPastSession,
        ungradedCount
      };
    }));

    const teachingClasses = teachingClassesRaw.filter(item => item !== null);

    const totalStudents = teachingClasses.reduce((sum, cls) => sum + cls.studentCount, 0);
    const pendingGrading = teachingClasses.reduce((sum, cls) => sum + cls.ungradedCount, 0);

    return {
      stats: {
        totalClasses: teachingClasses.length,
        totalStudents,
        pendingGrading
      },
      classes: teachingClasses
    };
};

// =========================================================
// MAHASISWA DASHBOARD
// =========================================================
const getMahasiswaDashboard = async (userId) => {
    // 1. Fetch all class enrollments for this user
    const enrollments = await PraktikumUserRole.findAll({
      where: { id_user: userId },
      include: [
        {
          model: Praktikum,
          attributes: ['id_praktikum', 'mata_kuliah', 'kode_kelas', 'jadwal', 'ruangan', 'tahun_pelajaran']
        },
        {
          model: Role
        }
      ]
    });

    // Exclude ONLY classes where user's role in that specific class is explicitly 'asdos'
    const mhsEnrollments = enrollments.filter(e => e.Praktikum && (!e.Role || e.Role.deskripsi?.toLowerCase() !== 'asdos'));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Format for Frontend with next session date and pending tasks count
    const enrolledClassesRaw = await Promise.all(mhsEnrollments.map(async (e) => {
      if (!e.Praktikum) return null;
      const id_praktikum = e.Praktikum.id_praktikum;

      let nextSessionDate = null;
      let nextSessionSesiKe = null;
      let isPastSession = false;
      let pendingTaskCount = 0;
      let closestDeadlineDays = null;

      try {
        // 1. Next Session (Find closest future session date, fallback to latest completed session)
        let nextSession = await Pertemuan.findOne({
          where: {
            id_praktikum,
            tanggal: { [Op.gte]: today }
          },
          order: [['tanggal', 'ASC']]
        });

        if (!nextSession) {
          nextSession = await Pertemuan.findOne({
            where: { id_praktikum },
            order: [['tanggal', 'DESC']]
          });
          if (nextSession) isPastSession = true;
        }

        if (nextSession) {
          nextSessionDate = nextSession.tanggal;
          nextSessionSesiKe = nextSession.sesi_ke;
        }

        // 2. Pending Tasks calculation
        const sessions = await Pertemuan.findAll({
          where: { id_praktikum },
          attributes: ['id_pertemuan']
        });
        const sessionIds = sessions.map(s => s.id_pertemuan);

        if (sessionIds.length > 0) {
          const tasks = await Tugas.find({
            pertemuan_id: { $in: sessionIds },
            tenggat_waktu: { $gte: new Date() }
          }).sort({ tenggat_waktu: 1 });

          const taskIds = tasks.map(t => t._id);

          // Note: Schema field is student_id (Number)
          const mySubmissions = await Pengumpulan.find({
            student_id: Number(userId),
            tugas_id: { $in: taskIds }
          }).select('tugas_id');

          const submittedTaskIds = new Set(mySubmissions.map(s => s.tugas_id.toString()));
          const uncompletedTasks = tasks.filter(t => !submittedTaskIds.has(t._id.toString()));

          pendingTaskCount = uncompletedTasks.length;

          if (uncompletedTasks.length > 0) {
            const closestDue = new Date(uncompletedTasks[0].tenggat_waktu);
            const now = new Date();
            const diffDays = Math.ceil((closestDue - now) / (1000 * 60 * 60 * 24));
            closestDeadlineDays = diffDays >= 0 ? diffDays : 0;
          }
        }
      } catch (err) {
        console.error(`Error processing metrics for praktikum ${id_praktikum}:`, err);
      }

      return {
        id_praktikum: e.Praktikum.id_praktikum,
        nama_praktikum: e.Praktikum.mata_kuliah,
        kode: e.Praktikum.kode_kelas,
        jadwal: e.Praktikum.jadwal,
        ruangan: e.Praktikum.ruangan,
        tahun_pelajaran: e.Praktikum.tahun_pelajaran,
        nextSessionDate,
        nextSessionSesiKe,
        isPastSession,
        pendingTaskCount,
        closestDeadlineDays
      };
    }));

    const enrolledClasses = enrolledClassesRaw.filter(item => item !== null);
    const totalPendingTasks = enrolledClasses.reduce((sum, cls) => sum + cls.pendingTaskCount, 0);

    return {
      stats: {
        activeClasses: enrolledClasses.length,
        assignmentsPending: totalPendingTasks
      },
      enrolledClasses: enrolledClasses
    };
};

// =========================================================
// ADMIN: Get Specific User Details + Enrollments
// =========================================================
const getUserById = async (id) => {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: PraktikumUserRole,
          include: [
            { model: Praktikum },
            { model: Role }
          ]
        }
      ]
    });
    if (!user) throw { status: 404, message: 'User not found' };

    const classes = user.PraktikumUserRoles.map(pur => ({
      id_praktikum: pur.id_praktikum,
      nama_praktikum: pur.Praktikum.mata_kuliah,
      kode_kelas: pur.Praktikum.kode_kelas,
      role: pur.Role.deskripsi,
      tahun: pur.Praktikum.tahun_pelajaran
    }));

    return {
      user: {
        id_user: user.id_user,
        nama: user.nama,
        nim: user.nim,
        email: user.email,
        prodi: user.prodi
      },
      classes: classes
    };
};

const updateUserByAdmin = async ({ id, nama, email, nim, prodi, angkatan }) => {
    await User.update(
      { nama, email, nim, prodi, angkatan },
      { where: { id_user: id } }
    );

    return { message: 'User updated by Admin' };
};

// =========================================================
// ADMIN: Assign User to Class
// =========================================================
const assignUserToClass = async ({ id_user, id_praktikum, role_name }) => {
    const roleDesc = role_name || 'mahasiswa';
    const role = await Role.findOne({ where: { deskripsi: roleDesc } });
    if (!role) throw { status: 400, message: 'Role not found' };

    const exists = await PraktikumUserRole.findOne({
      where: {
        id_user,
        id_praktikum,
        id_role: role.id_role
      }
    });

    if (exists) throw { status: 400, message: 'User is already enrolled in this class with this role' };

    await PraktikumUserRole.create({
      id_user,
      id_praktikum,
      id_role: role.id_role
    });

    return { message: 'User assigned successfully' };
};

// =========================================================
// ADMIN: Remove User from Class
// =========================================================
const removeUserFromClass = async ({ id_user, id_praktikum }) => {
    await PraktikumUserRole.destroy({
      where: { id_user, id_praktikum }
    });

    return { message: 'User removed from class' };
};

export default {
  getProfile,
  getMyClassRole,
  updateProfile,
  getAsdosDashboard,
  getMahasiswaDashboard,
  getUserById,
  updateUserByAdmin,
  assignUserToClass,
  removeUserFromClass,
}