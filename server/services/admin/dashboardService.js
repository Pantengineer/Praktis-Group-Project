// Model Imports
import { User, Role, PraktikumUserRole, Praktikum, Pertemuan } from '../../models/sql/index.js';

const getDashboardStats = async () => {
    // 1. Total Asdos (Contextual)
    const totalAsdos = await PraktikumUserRole.count({
        distinct: true,
        col: 'id_user',
        include: [{
            model: Role,
            where: { deskripsi: 'asdos' }
        }]
    });

    // 2. Total Students
    // Count all distinct users who have the role "mahasiswa" (Global or Contextual)
    const mhsUsers = await User.findAll({
        include: [{ model: Role, attributes: ['deskripsi'] }],
    });
    // Filter to only true students (no admin, no global asdos)
    const trueStudents = mhsUsers.filter(u => {
        const isAdmin = u.Roles?.some(r => r.deskripsi === 'admin');
        const isAsdos = u.Roles?.some(r => r.deskripsi === 'asdos');
        return !isAdmin && !isAsdos;
    });
    const totalStudents = trueStudents.length;

    // 3. Program Studi Distribution
    const prodiDistribution = {};
    trueStudents.forEach(student => {
        const prodi = student.prodi || 'Tidak Diketahui';
        prodiDistribution[prodi] = (prodiDistribution[prodi] || 0) + 1;
    });
    const prodiData = Object.keys(prodiDistribution).map(key => ({
        name: key,
        value: prodiDistribution[key]
    }));

    // 4. Classes Needing Attention
    const allClasses = await Praktikum.findAll({
        include: [{
            model: PraktikumUserRole,
            include: [{ model: Role }]
        }]
    });
    const totalClasses = allClasses.length;

    const classesNeedingAttention = [];
    allClasses.forEach(cls => {
        let asdosCount = 0;
        let studentCount = 0;
        if (cls.PraktikumUserRoles) {
            cls.PraktikumUserRoles.forEach(pur => {
                if (pur.Role?.deskripsi === 'asdos') asdosCount++;
                if (pur.Role?.deskripsi === 'mahasiswa') studentCount++;
            });
        }
        if (asdosCount === 0 || studentCount === 0) {
            classesNeedingAttention.push({
                id_praktikum: cls.id_praktikum,
                mata_kuliah: cls.mata_kuliah,
                kode_kelas: cls.kode_kelas,
                asdosCount,
                studentCount
            });
        }
    });

    // 5. Session Dates (for calendar & conflict detection)
    const sessions = await Pertemuan.findAll({
        attributes: ['id_pertemuan', 'tanggal', 'sesi_ke', 'waktu_mulai', 'waktu_selesai', 'ruangan'],
        include: [{
            model: Praktikum,
            attributes: ['id_praktikum', 'kode_kelas', 'mata_kuliah', 'ruangan']
        }]
    });
    const sessionDates = sessions.map(s => ({
        id_pertemuan: s.id_pertemuan,
        tanggal: s.tanggal,
        sesi_ke: s.sesi_ke,
        waktu_mulai: s.waktu_mulai || '08:00',
        waktu_selesai: s.waktu_selesai || '10:00',
        ruangan: s.ruangan || s.Praktikum?.ruangan || 'Lab B',
        mata_kuliah: s.Praktikum?.mata_kuliah,
        kode_kelas: s.Praktikum?.kode_kelas,
        id_praktikum: s.Praktikum?.id_praktikum
    }));

    return {
        totalAsdos,
        totalClasses,
        totalStudents,
        prodiDistribution: prodiData,
        classesNeedingAttention,
        sessionDates
    };
}

export default {
    getDashboardStats,
}