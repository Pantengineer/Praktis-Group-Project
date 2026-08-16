// server/controllers/userController.js
import { Op } from 'sequelize';

import { User, Praktikum, PraktikumUserRole, Role, Pertemuan } from '../models/sql/index.js';
import Tugas from '../models/nosql/Tugas.js';
import Pengumpulan from '../models/nosql/Pengumpulan.js';

import bcrypt from 'bcryptjs';
import response from '../utils/responseHelper.js';

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From authMiddleware

    // 1. Fetch User + Classes (Same logic as Admin view)
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

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Format Classes List
    const rawRoles = user.PraktikumUserRoles || [];
    const classes = rawRoles.map(pur => ({
      id_praktikum: pur.id_praktikum,
      nama_praktikum: pur.Praktikum ? pur.Praktikum.mata_kuliah : 'Unknown',
      kode_kelas: pur.Praktikum ? pur.Praktikum.kode_kelas : '-',
      role: pur.Role ? pur.Role.deskripsi : 'member',
      tahun: pur.Praktikum ? pur.Praktikum.tahun_pelajaran : '-'
    }));

    // 3. Return exact structure expected by Profile.jsx
    // We use res.json directly to match the structure of getUserById
    res.json({
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
    });

  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: 'Error retrieving profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    // Extract all possible fields from the request body
    const { nama, email, nim, prodi, angkatan, password } = req.body;

    // 1. Fetch current user
    const user = await User.findByPk(userId);
    if (!user) {
      return response.error(res, 404, 'User not found');
    }

    // 2. CHECK UNIQUENESS (Prevent duplicate Email or NIM)
    // We only check if the user is actually CHANGING the email or nim
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

      if (conflict) {
        return response.error(res, 400, 'Email atau NIM sudah digunakan oleh user lain.');
      }
    }

    // 3. Update Standard Fields
    if (nama) user.nama = nama;
    if (email) user.email = email;
    if (nim) user.nim = nim;
    if (prodi) user.prodi = prodi;
    if (angkatan) user.angkatan = angkatan;

    // 4. Update Password (HASH IT!)
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // 5. Save changes
    await user.save();

    // 6. Return response (excluding password)
    const userData = user.toJSON();
    delete userData.password;

    response.success(res, 200, 'Profil berhasil diperbarui', userData);

  } catch (error) {
    console.error("Update Profile Error:", error);
    response.error(res, 500, error.message);
  }
};

// =========================================================
// ASDOS DASHBOARD
// =========================================================
const getAsdosDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const assignments = await PraktikumUserRole.findAll({
      where: { id_user: userId },
      include: [
        {
          model: Praktikum,
          // CORRECTION: Using 'mata_kuliah' and 'kode_kelas' based on your Praktikum.js
          attributes: ['id_praktikum', 'mata_kuliah', 'kode_kelas', 'tahun_pelajaran', 'jadwal', 'ruangan']
        },
        {
          model: Role,
          // CORRECTION: Using 'deskripsi' based on your Role.js
          where: { deskripsi: 'asdos' }
        }
      ]
    });

    // Format data with additional stats per class
    const teachingClassesRaw = await Promise.all(assignments.map(async (a) => {
      if (!a.Praktikum) return null;

      const id_praktikum = a.Praktikum.id_praktikum;

      // 1. Student Count
      const studentCount = await PraktikumUserRole.count({
        where: { id_praktikum },
        include: [{ model: Role, where: { deskripsi: 'mahasiswa' } }]
      });

      // 2. Next Session (Find closest future date, fallback to latest past session)
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

      // 3. Ungraded Tasks
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

    // Aggregate global stats for top cards
    const totalStudents = teachingClasses.reduce((sum, cls) => sum + cls.studentCount, 0);
    const pendingGrading = teachingClasses.reduce((sum, cls) => sum + cls.ungradedCount, 0);

    res.json({
      stats: {
        totalClasses: teachingClasses.length,
        totalStudents,
        pendingGrading
      },
      classes: teachingClasses
    });

  } catch (error) {
    console.error("Asdos Dashboard Error:", error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};

// =========================================================
// MAHASISWA DASHBOARD
// =========================================================
const getMahasiswaDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

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

    res.json({
      stats: {
        activeClasses: enrolledClasses.length,
        assignmentsPending: totalPendingTasks
      },
      enrolledClasses: enrolledClasses
    });

  } catch (error) {
    console.error("Mhs Dashboard Error:", error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};

// =========================================================
// ADMIN: Get Specific User Details + Enrollments
// =========================================================
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

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

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Format the classes for cleaner JSON
    const classes = user.PraktikumUserRoles.map(pur => ({
      id_praktikum: pur.id_praktikum,
      nama_praktikum: pur.Praktikum.mata_kuliah,
      kode_kelas: pur.Praktikum.kode_kelas,
      role: pur.Role.deskripsi,
      tahun: pur.Praktikum.tahun_pelajaran
    }));

    res.json({
      user: {
        id_user: user.id_user,
        nama: user.nama,
        nim: user.nim,
        email: user.email,
        prodi: user.prodi
      },
      classes: classes
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
};

const updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, nim, prodi, angkatan } = req.body;

    // Simple update without complex checks for now
    await User.update(
      { nama, email, nim, prodi, angkatan },
      { where: { id_user: id } }
    );

    res.json({ message: 'User updated by Admin' });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
};

// =========================================================
// ADMIN: Assign User to Class
// =========================================================
const assignUserToClass = async (req, res) => {
  try {
    const { id_user, id_praktikum, role_name } = req.body;

    // 1. Find Role ID (Default to 'mahasiswa' if not provided)
    const roleDesc = role_name || 'mahasiswa';
    const role = await Role.findOne({ where: { deskripsi: roleDesc } });
    if (!role) return res.status(400).json({ message: 'Role not found' });

    // 2. Check if already enrolled
    const exists = await PraktikumUserRole.findOne({
      where: {
        id_user,
        id_praktikum,
        id_role: role.id_role
      }
    });

    if (exists) {
      return res.status(400).json({ message: 'User is already enrolled in this class with this role' });
    }

    // 3. Create Enrollment
    await PraktikumUserRole.create({
      id_user,
      id_praktikum,
      id_role: role.id_role
    });

    res.json({ message: 'User assigned successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error assigning class' });
  }
};

// =========================================================
// ADMIN: Remove User from Class
// =========================================================
const removeUserFromClass = async (req, res) => {
  try {
    const { id_user, id_praktikum } = req.body;

    await PraktikumUserRole.destroy({
      where: { id_user, id_praktikum }
    });

    res.json({ message: 'User removed from class' });

  } catch (error) {
    res.status(500).json({ message: 'Error removing user' });
  }
};

export default {
  getProfile,
  updateProfile,
  getAsdosDashboard,
  getMahasiswaDashboard,
  getUserById,
  updateUserByAdmin,
  assignUserToClass,
  removeUserFromClass,
}