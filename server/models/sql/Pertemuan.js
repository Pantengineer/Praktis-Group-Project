// server/models/sql/Pertemuan.js
export default (sequelize, DataTypes) => {
  const Pertemuan = sequelize.define('Pertemuan', {
    id_pertemuan: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    id_praktikum: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'praktikum', key: 'id_praktikum' }
    },
    sesi_ke: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    tanggal: { type: DataTypes.DATEONLY, allowNull: false },
    waktu_mulai: { type: DataTypes.TIME, allowNull: false },
    waktu_selesai: { type: DataTypes.TIME, allowNull: false },
    ruangan: { type: DataTypes.STRING(50) }
  }, {
    tableName: 'pertemuan_praktikum',
    timestamps: false
  });
  return Pertemuan;
};