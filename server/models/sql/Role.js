// server/models/sql/Role.js
export default (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id_role: {
      type: DataTypes.TINYINT.UNSIGNED, // Matches SQL 'tinyint(3) UNSIGNED'
      primaryKey: true,
      autoIncrement: true
    },
    deskripsi: {
      type: DataTypes.STRING(20), // Matches SQL 'varchar(20)'
      allowNull: false,
      unique: true
    }
  }, {
    tableName: 'role',
    timestamps: false
  });

  return Role;
};