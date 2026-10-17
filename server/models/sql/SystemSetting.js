// server/models/sql/SystemSetting.js
export default (sequelize, DataTypes) => {
  const SystemSetting = sequelize.define('SystemSetting', {
    id_setting: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    setting_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    setting_value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deskripsi: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'system_settings',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['setting_key']
      }
    ]
  });

  return SystemSetting;
};
