// server/server.js
import express, { json } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Configs & Utils
import env from './config/env.js';
import logger from './utils/logger.js';
import { sequelize, connectSQLWithRetry } from './config/db.sql.js';
import connectMongo from './config/db.mongo.js';
import corsMiddleware from './config/cors.js';

// Middleware
import { globalLimiter } from './middleware/rateLimiter.js';
import { ipBanMiddleware } from './middleware/ipBanMiddleware.js';
import { apiLoggerMiddleware } from './middleware/apiLoggerMiddleware.js';
import errorHandler from './middleware/errorHandler.js';

// Routes
import apiRoutes from './routes/index.js';

// Initialize App
const app = express();

// Global Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(corsMiddleware);
app.use(json());
app.use(cookieParser()); // Parse cookies for HttpOnly JWT (2.1)

// API Middleware
app.use('/api', ipBanMiddleware, apiLoggerMiddleware, globalLimiter);

// Routes
app.get('/', (req, res) => res.send('API is running...'));
app.use('/api', apiRoutes);

// Error Handling
app.use(errorHandler)

// Server Initialization
const startServer = async () => {
  try {
    await connectMongo();
    await connectSQLWithRetry(sequelize);

    app.listen(env.port, () => {
      logger.info(`🚀 Server running in ${env.nodeEnv} mode on port ${env.port}`);
    });
  } catch (error) {
    logger.error('❌ Server startup failed:', { error: error.message });
    process.exit(1);
  }
};

startServer();