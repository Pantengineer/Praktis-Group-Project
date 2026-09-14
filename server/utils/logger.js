// server/utils/logger.js
// 2.10: Winston structured logger — replaces scattered console.log/error calls.
// Logs are written as structured JSON in production for easy parsing by log aggregators.
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? format.json()
      : format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
  ),
  transports: [
    new transports.Console(),
    // In production, also write to rotating log files
    ...(process.env.NODE_ENV === 'production'
      ? [
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
      ]
      : [])
  ]
});

export default logger;