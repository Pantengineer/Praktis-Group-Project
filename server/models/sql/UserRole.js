// server/models/sql/UserRole.js
export default (sequelize, DataTypes) => {
  const UserRole = sequelize.define('UserRole', {
    id_user: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      references: { model: 'user', key: 'id_user' }
    },
    id_role: {
      type: DataTypes.TINYINT.UNSIGNED,
      primaryKey: true,
      references: { model: 'role', key: 'id_role' }
    }
  }, {
    tableName: 'user_role',
    timestamps: false
  });
  return UserRole;
};