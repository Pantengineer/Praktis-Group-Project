import 'dotenv/config';

import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

import { sequelize, User, Role, UserRole, PresensiStatus, Praktikum, PraktikumUserRole, Pertemuan } from './models/sql/index.js';
import connectMongo from './config/db.mongo.js';
import Materi from './models/nosql/Materi.js';
import Tugas from './models/nosql/Tugas.js';
import Pengumpulan from './models/nosql/Pengumpulan.js';

// Wiping uploads directory safely
const clearUploads = () => {
  const uploadDirs = ['materials', 'tasks', 'submissions'];
  uploadDirs.forEach(dir => {
    const dirPath = path.join(import.meta.dirname, 'uploads', dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
    fs.mkdirSync(dirPath, { recursive: true });
  });
  console.log('✅ Uploads directories wiped and recreated.');
};

async function seed() {
  try {
    console.log('⏳ Cleaning uploads folder...');
    clearUploads();

    console.log('⏳ Connecting to MongoDB and cleaning collections...');
    await connectMongo();
    await Materi.deleteMany({});
    await Tugas.deleteMany({});
    await Pengumpulan.deleteMany({});
    console.log('✅ MongoDB collections cleaned.');

    console.log('⏳ Starting SQL database sync...');
    await sequelize.sync({ force: true });
    console.log('✅ Tables synced successfully.');

    console.log('⏳ Seeding Roles...');
    const roles = ['admin', 'asdos', 'mahasiswa'];
    for (const roleDesc of roles) {
      await Role.findOrCreate({ where: { deskripsi: roleDesc } });
    }
    console.log('✅ Roles seeded.');

    console.log('⏳ Seeding Attendance Statuses...');
    const statuses = ['Hadir', 'Izin', 'Sakit', 'Alfa'];
    for (const status of statuses) {
      await PresensiStatus.findOrCreate({ where: { status: status } });
    }
    console.log('✅ Attendance Statuses seeded.');

    console.log('⏳ Seeding Users (Admin, Mahasiswa)...');

    // 1 Admin
    const adminPass = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    const adminRole = await Role.findOne({ where: { deskripsi: 'admin' } });
    const adminUser = await User.create({
      nama: process.env.ADMIN_NAME, email: process.env.ADMIN_EMAIL, password: adminPass, nim: process.env.ADMIN_NIM
    });
    await UserRole.create({ id_user: adminUser.id_user, id_role: adminRole.id_role });

    // 5 Mahasiswa
    const mhsPass = await bcrypt.hash(process.env.MHS_PASSWORD, 10);
    const mhsRole = await Role.findOne({ where: { deskripsi: 'mahasiswa' } });
    const asdosRole = await Role.findOne({ where: { deskripsi: 'asdos' } });

    const mhsUsers = [];
    for (let i = 1; i <= 5; i++) {
      const u = await User.create({
        nama: `Mahasiswa ${i}`, email: `mhs${i}@mhs.com`, password: mhsPass, nim: `123200100${i}`, prodi: 'Informatika', angkatan: 2023
      });
      await UserRole.create({ id_user: u.id_user, id_role: mhsRole.id_role }); // GLOBAL ROLE is always mahasiswa
      mhsUsers.push(u);
    }
    console.log('✅ Admin and 5 Mahasiswa users created.');

    console.log('⏳ Seeding Praktikum (Classes)...');

    // Helper to generate 10 sessions based on system logic
    const generateSessions = async (praktikum, tanggal_mulai, waktu_mulai, waktu_selesai) => {
      const sessions = [];
      for (let i = 0; i < 10; i++) {
        const sessionDate = new Date(tanggal_mulai);
        sessionDate.setDate(sessionDate.getDate() + (i * 7));
        sessions.push({
          id_praktikum: praktikum.id_praktikum,
          sesi_ke: i + 1,
          judul_pertemuan: `Pertemuan ${i + 1}`,
          tanggal: sessionDate,
          waktu_mulai: waktu_mulai,
          waktu_selesai: waktu_selesai,
          ruangan: praktikum.ruangan
        });
      }
      await Pertemuan.bulkCreate(sessions);
    };

    // Praktikum 1
    const p1 = await Praktikum.create({
      mata_kuliah: 'Pemrograman Web',
      kode_kelas: 'WEB-A',
      tahun_pelajaran: '2025/2026',
      jadwal: 'Senin, 08:00 - 10:00',
      ruangan: 'Lab Komputer 1',
      sks: 3,
      semester: 6
    });
    await generateSessions(p1, '2026-08-01', '08:00', '10:00');

    // Praktikum 2
    const p2 = await Praktikum.create({
      mata_kuliah: 'Struktur Data',
      kode_kelas: 'SDA-B',
      tahun_pelajaran: '2025/2026',
      jadwal: 'Rabu, 13:00 - 15:00',
      ruangan: 'Lab Komputer 2',
      sks: 3,
      semester: 4
    });
    await generateSessions(p2, '2026-08-03', '13:00', '15:00');

    console.log('✅ Praktikum and 10 weekly sessions per Praktikum generated.');

    console.log('⏳ Enrolling Users to Praktikum...');

    // Praktikum 1: mhs1 is Asdos, mhs2-mhs5 are Mahasiswa
    await PraktikumUserRole.create({ id_user: mhsUsers[0].id_user, id_role: asdosRole.id_role, id_praktikum: p1.id_praktikum });
    for (let i = 1; i < 5; i++) {
      await PraktikumUserRole.create({ id_user: mhsUsers[i].id_user, id_role: mhsRole.id_role, id_praktikum: p1.id_praktikum });
    }

    // Praktikum 2: mhs2 is Asdos, mhs1, mhs3-mhs5 are Mahasiswa
    await PraktikumUserRole.create({ id_user: mhsUsers[1].id_user, id_role: asdosRole.id_role, id_praktikum: p2.id_praktikum });
    await PraktikumUserRole.create({ id_user: mhsUsers[0].id_user, id_role: mhsRole.id_role, id_praktikum: p2.id_praktikum });
    for (let i = 2; i < 5; i++) {
      await PraktikumUserRole.create({ id_user: mhsUsers[i].id_user, id_role: mhsRole.id_role, id_praktikum: p2.id_praktikum });
    }

    console.log('✅ Users enrolled contextually (Asdos and Mahasiswa).');

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
