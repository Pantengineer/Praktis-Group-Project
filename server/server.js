// server/server.js
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// Configs & Utils
const env = require('./config/env');
const logger = require('./utils/logger');
const { sequelize, connectSQLWithRetry } = require('./config/db.sql');
const connectMongo = require('./config/db.mongo');
const corsMiddleware = require('./config/cors')

// Middleware
const { globalLimiter } = require('./middleware/apiRateLimiter');
const { ipBanMiddleware } = require('./middleware/ipBanMiddleware');
const { apiLoggerMiddleware } = require('./middleware/apiLoggerMiddleware');
const errorHandler = require('./middleware/errorHandler');

// Routes
const apiRoutes = require('./routes'); // should automatically resolve to routes/index.js

// Initialize App
const app = express();

// Global Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(corsMiddleware);
app.use(express.json());
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