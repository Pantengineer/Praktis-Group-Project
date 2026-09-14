// server/config/db.mongo.js
import { connect } from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

const { mongo } = env;

const connectMongo = async (maxRetries = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await connect(mongo.uri);
      logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
      logger.warn(`⚠️ MongoDB connection attempt ${attempt}/${maxRetries} failed (${err.message}. Retrying in ${delayMs / 1000}s...`);
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
};

export default connectMongo;