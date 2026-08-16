// server/config/env.js
import 'dotenv/config';

const requiredVars = ['MONGO_URI', 'MYSQL_HOST', 'JWT_SECRET'];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`⚠️  Missing required environment variable: ${key}`);
  }
});

const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  sql: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB_NAME,
    dialect: process.env.MYSQL_DIALECT || 'mysql',
  },

  mongo: {
    uri: process.env.MONGO_URI,
  },

  jwtSecret: process.env.JWT_SECRET,
};

export default env;