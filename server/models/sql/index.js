const { Sequelize } = require('sequelize');

// 1. IMPORT YOUR EXISTING CONNECTION
// instead of treating it like a config file
const { sequelize } = require('../../config/db.sql');

// 2. Initialize Models
// Pass the existing 'sequelize' connection to the factory functions
const User = require('./User')(sequelize, Sequelize);
const Role = require('./Role')(sequelize, Sequelize);
const UserRole = require('./UserRole')(sequelize, Sequelize);
const Praktikum = require('./Praktikum')(sequelize, Sequelize);
const PraktikumUserRole = require('./PraktikumUserRole')(sequelize, Sequelize);
const Pertemuan = require('./Pertemuan')(sequelize, Sequelize);
const Presensi = require('./Presensi')(sequelize, Sequelize);
const PresensiStatus = require('./PresensiStatus')(sequelize, Sequelize);

// 3. Define Associations

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

// 4. Export
module.exports = {
  sequelize,
  Sequelize,
  User,
  Role,
  UserRole,
  Praktikum,
  PraktikumUserRole,
  Pertemuan,
  Presensi,
  PresensiStatus
};