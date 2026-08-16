// server/models/sql/PraktikumUserRole.js
export default (sequelize, DataTypes) => {
  const PraktikumUserRole = sequelize.define('PraktikumUserRole', {
    id_user: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      references: { model: 'user', key: 'id_user' }
    },
    id_praktikum: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      references: { model: 'praktikum', key: 'id_praktikum' }
    },
    id_role: {
      type: DataTypes.TINYINT.UNSIGNED,
      primaryKey: true,
      references: { model: 'role', key: 'id_role' }
    }
    // ❌ REMOVED: status column block
  }, {
    tableName: 'praktikum_user_role',
    timestamps: false
  });

  return PraktikumUserRole;
};