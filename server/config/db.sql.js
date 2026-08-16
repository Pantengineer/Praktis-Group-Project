// server/config/db.sql.js
import { Sequelize } from 'sequelize';
import env from './env.js';
import logger from '../utils/logger.js';

const { sql } = env;

const sequelize = new Sequelize(
  sql.database,
  sql.user,
  sql.password,
  {
    host: sql.host,
    dialect: sql.dialect,
    logging: false, // Set to console.log to see raw SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    }
  }
);

const connectSQLWithRetry = async (sequelizeInstance, maxRetries = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelizeInstance.authenticate();
      logger.info('✅ MySQL (MariaDB) Connected via Sequelize');
      return;
    } catch (err) {
      if (attempt == maxRetries) throw err;
      logger.warn(`⚠️ MySQL connection attempt ${attempt}/${maxRetries} failed (${err.message}. Retrying in ${delayMs / 1000}s...`);
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

export {
  sequelize,
  connectSQLWithRetry,
}