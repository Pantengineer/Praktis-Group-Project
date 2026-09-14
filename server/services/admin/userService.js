import { User, Role, PraktikumUserRole, UserRole } from '../../models/sql/index.js';
import bcrypt from 'bcryptjs';

const getAllUsers = async ({ page, limit }) => {
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      attributes: ['id_user', 'nama', 'email', 'nim', 'prodi', 'angkatan'],
      include: [
        {
          model: Role,
          attributes: ['deskripsi'],
          through: { attributes: [] }
        },
        {
          model: PraktikumUserRole,
          attributes: ['id_role', 'id_praktikum'],
          include: [{ model: Role, attributes: ['deskripsi'] }],
          required: false
        }
      ],
      limit,
      offset,
      distinct: true // Required for correct count with associations
    });

    const formattedUsers = users.map(u => {
      const user = u.toJSON();
      // If they are an asdos contextually, add it to their roles array for UI purposes
      const isContextualAsdos = user.PraktikumUserRoles?.some(pur => pur.Role?.deskripsi === 'asdos');
      if (isContextualAsdos && !user.Roles.some(r => r.deskripsi === 'asdos')) {
        user.Roles.push({ deskripsi: 'asdos' });
      }
      return user;
    });

    return { total: count, page, limit, data: formattedUsers };
};

const createUser = async ({ nama, nim, email, password, role, prodi, angkatan }) => {
    // 1. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Create User
    const newUser = await User.create({
      nama,
      nim: nim || null,
      email,
      password: hashedPassword,
      prodi: prodi || null,
      angkatan: angkatan || null
    });

    // 3. Assign Global Role
    // Strictly enforce that global roles can only be 'admin' or 'mahasiswa'
    const allowedGlobalRoles = ['admin', 'mahasiswa'];
    const assignedRole = allowedGlobalRoles.includes(role) ? role : 'mahasiswa';
    const roleRecord = await Role.findOne({ where: { deskripsi: assignedRole } });

    if (roleRecord) {
      // Manually create the UserRole entry
      await UserRole.create({
        id_user: newUser.id_user,
        id_role: roleRecord.id_role
      });
    }

    return { message: 'User berhasil dibuat.' };
};

const deleteUser = async (id_user) => {
    await User.destroy({ where: { id_user } });
    return { message: 'User telah dihapus.' };
};

export default {
  getAllUsers,
  createUser,
  deleteUser,
};