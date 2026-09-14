// server/models/sql/Presensi.js
export default (sequelize, DataTypes) => {
  const Presensi = sequelize.define('Presensi', {
    id_presensi: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    id_pertemuan: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'pertemuan_praktikum', key: 'id_pertemuan' }
    },
    id_user: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'user', key: 'id_user' }
    },
    id_status: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      references: { model: 'presensi_status', key: 'id_status' }
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'presensi',
    timestamps: false
  });
  return Presensi;
};