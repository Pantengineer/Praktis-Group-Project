// Import Sequelize Connection
import { sequelize } from '../../config/db.sql.js';
import { DataTypes } from 'sequelize';

// Import SQL Models
import UserModel from './User.js';
import RoleModel from './Role.js';
import UserRoleModel from './UserRole.js';
import PraktikumModel from './Praktikum.js';
import PraktikumUserRoleModel from './PraktikumUserRole.js';
import PertemuanModel from './Pertemuan.js';
import PresensiModel from './Presensi.js';
import PresensiStatusModel from './PresensiStatus.js';

const User = UserModel(sequelize, DataTypes);
const Role = RoleModel(sequelize, DataTypes);
const UserRole = UserRoleModel(sequelize, DataTypes);
const Praktikum = PraktikumModel(sequelize, DataTypes);
const PraktikumUserRole = PraktikumUserRoleModel(sequelize, DataTypes);
const Pertemuan = PertemuanModel(sequelize, DataTypes);
const Presensi = PresensiModel(sequelize, DataTypes);
const PresensiStatus = PresensiStatusModel(sequelize, DataTypes);

// Define Associations
// A. Global Roles
User.belongsToMany(Role, { through: UserRole, foreignKey: 'id_user', otherKey: 'id_role' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'id_role', otherKey: 'id_user' });

// B. Class Enrollment
User.belongsToMany(Praktikum, { through: PraktikumUserRole, foreignKey: 'id_user', otherKey: 'id_praktikum' });
Praktikum.belongsToMany(User, { through: PraktikumUserRole, foreignKey: 'id_praktikum', otherKey: 'id_user' });

User.hasMany(PraktikumUserRole, { foreignKey: 'id_user' });
Praktikum.hasMany(PraktikumUserRole, { foreignKey: 'id_praktikum' });
Role.hasMany(PraktikumUserRole, { foreignKey: 'id_role' });

PraktikumUserRole.belongsTo(User, { foreignKey: 'id_user' });
PraktikumUserRole.belongsTo(Role, { foreignKey: 'id_role' });
PraktikumUserRole.belongsTo(Praktikum, { foreignKey: 'id_praktikum' });

// C. Sessions
Praktikum.hasMany(Pertemuan, { foreignKey: 'id_praktikum' });
Pertemuan.belongsTo(Praktikum, { foreignKey: 'id_praktikum' });

// D. Attendance
Pertemuan.hasMany(Presensi, { foreignKey: 'id_pertemuan' });
Presensi.belongsTo(Pertemuan, { foreignKey: 'id_pertemuan' });

User.hasMany(Presensi, { foreignKey: 'id_user' });
Presensi.belongsTo(User, { foreignKey: 'id_user' });

PresensiStatus.hasMany(Presensi, { foreignKey: 'id_status' });
Presensi.belongsTo(PresensiStatus, { foreignKey: 'id_status' });

// Export
export {
  sequelize,
  DataTypes,
  User,
  Role,
  UserRole,
  Praktikum,
  PraktikumUserRole,
  Pertemuan,
  Presensi,
  PresensiStatus
};