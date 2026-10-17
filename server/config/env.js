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

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Praktis Support <no-reply@praktis.ac.id>'
  }
};

export default env;