import { PraktikumUserRole, User, Role } from "../../models/sql/index.js";

const getAsdos = async (id_praktikum) => {
  // Find users with 'asdos' role for this class
  const asdosList = await PraktikumUserRole.findAll({
    where: { id_praktikum: id_praktikum },
    include: [
      { model: User, attributes: ['id_user', 'nama', 'nim', 'email'] },
      { model: Role, where: { deskripsi: 'asdos' } } // Ensure we only fetch Asdos, not students
    ]
  });

  return asdosList;
};

const assignAsdos = async ({ id_user, id_praktikum }) => {
    // A. Find Asdos Role ID
    const asdosRole = await Role.findOne({ where: { deskripsi: 'asdos' } });
    if (!asdosRole) throw { status: 500, message: 'Role Asdos tidak ditemukan.' };

    // B. Check if already assigned
    const existing = await PraktikumUserRole.findOne({
      where: { id_user, id_praktikum, id_role: asdosRole.id_role }
    });

    if (existing) {
      throw { status: 400, message: 'User sudah memasuki kelas ini.' };
    }

    // C. Create Assignment (No status needed!)
    await PraktikumUserRole.create({
      id_user,
      id_praktikum,
      id_role: asdosRole.id_role
    });

    return { message: 'Asdos berhasil ditugaskan.' };
};

const removeAsdos = async ({ id_user, id_praktikum }) => {
    const asdosRole = await Role.findOne({ where: { deskripsi: 'asdos' } });

    await PraktikumUserRole.destroy({
      where: {
        id_user,
        id_praktikum,
        id_role: asdosRole.id_role
      }
    });

    return { message: 'Asdos berhasil dilengserkan dari kelas.' };
};

const assignMahasiswaToPraktikum = async ({ id_user, id_praktikum }) => {
    const mhsRole = await Role.findOne({ where: { deskripsi: 'mahasiswa' } });
    if (!mhsRole) throw { status: 500, message: 'Role Mahasiswa not found' };

    const existing = await PraktikumUserRole.findOne({
      where: { id_user, id_praktikum, id_role: mhsRole.id_role }
    });

    if (existing) {
      throw { status: 400, message: 'User already enrolled in this class' };
    }

    await PraktikumUserRole.create({
      id_user,
      id_praktikum,
      id_role: mhsRole.id_role
    });

    return { message: 'Mahasiswa berhasil dimasukkan kedalam praktikum.' };
};

const removeMahasiswaFromPraktikum = async ({ id_user, id_praktikum }) => {
    const mhsRole = await Role.findOne({ where: { deskripsi: 'mahasiswa' } });

    await PraktikumUserRole.destroy({
      where: {
        id_user,
        id_praktikum,
        id_role: mhsRole.id_role
      }
    });

    return { message: 'Mahasiswa berhasil dikeluarkan dari praktikum.' };
};

export default {
  getAsdos,
  assignAsdos,
  removeAsdos,
  assignMahasiswaToPraktikum,
  removeMahasiswaFromPraktikum,
}