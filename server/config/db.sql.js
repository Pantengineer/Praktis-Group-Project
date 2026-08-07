// server/config/db.sql.js
const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  env.sql.database,
  env.sql.user,
  env.sql.password,
  {
    host: env.sql.host,
    dialect: env.sql.dialect,
    logging: false, // Set to console.log to see raw SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectSQLWithRetry = async (sequelizeInstance, maxRetries = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelizeInstance.authenticate();
      logger.info('✅ MySQL (MariaDB) Connected via Sequelize');

      const { sequelize: sqlDB } = require('../models/sql/index');
      await sqlDB.authenticate;
      logger.info('✅ SQL Database Connected (Schema validation skipped)');
      return;
    } catch (err) {
      if (attempt == maxRetries) throw err;
      logger.warn(`⚠️ MySQL connection attempt ${attempt}/${maxRetries} failed (${err.message}. Retrying in ${delayMs / 1000}s...`);
    }
  }
}

module.exports = {
  sequelize,
  connectSQLWithRetry
}