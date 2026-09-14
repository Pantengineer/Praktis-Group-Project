export default (sequelize, DataTypes) => {
  const Praktikum = sequelize.define('Praktikum', {
    id_praktikum: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    mata_kuliah: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    // ✅ UPDATE THIS FIELD
    kode_kelas: { 
      type: DataTypes.STRING(20), // Matches your VARCHAR(20)
      allowNull: true
    },
    tahun_pelajaran: {
      type: DataTypes.STRING(9),
      allowNull: false
    },
    jadwal: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    ruangan: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    sks: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false
    },
    semester: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false
    }
  }, {
    tableName: 'praktikum',
    timestamps: false
  });

  return Praktikum;
};