// server/services/praktikumService.js
import { Praktikum, User, PraktikumUserRole, Role } from '../models/sql/index.js';

// 1. Create a new Class (Admin Only)
const createPraktikum = async ({ mata_kuliah, tahun_pelajaran, sks, semester, jadwal, ruangan }) => {
    const newClass = await Praktikum.create({
      mata_kuliah,
      tahun_pelajaran,
      sks,
      semester,
      jadwal,
      ruangan
    });

    return { message: 'Class created successfully', data: newClass};
};

// 2. Get All Classes (Visible to Admin, later filtered for students)
const getAllPraktikums = async () => {
    const classes = await Praktikum.findAll();
    return { message: 'Classes retrieved', data: classes};
};

// 3. Enroll a User into a Class (Admin Only)
const enrollUser = async ({ id_praktikum, id_user, role_name }) => {
    const role = await Role.findOne({ where: { deskripsi: role_name } });
    if (!role) throw { message: 'Role not found' };

    const user = await User.findByPk(id_user);
    if (!user) throw { message: 'User not found' };

    await PraktikumUserRole.create({
      id_praktikum,
      id_user,
      id_role: role.id_role
    });

    return { message: `User enrolled as ${role_name} successfully` };
};

export default {
  createPraktikum,
  getAllPraktikums,
  enrollUser,
};