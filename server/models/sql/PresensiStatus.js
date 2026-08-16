// server/models/sql/PresensiStatus.js
export default (sequelize, DataTypes) => {
  const PresensiStatus = sequelize.define('PresensiStatus', {
    id_status: {
      type: DataTypes.TINYINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false
    }
  }, {
    tableName: 'presensi_status',
    timestamps: false
  });
  return PresensiStatus;
};