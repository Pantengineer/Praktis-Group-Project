// server/middleware/apiLoggerMiddleware.js
import ApiRequestLog from '../models/nosql/ApiRequestLog.js';

const apiLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Listen to response finish event to capture metrics asynchronously
  res.on('finish', () => {
    try {
      const durationMs = Date.now() - startTime;
      const contentLength = parseInt(res.get('Content-Length') || '0', 10);
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';

      // Asynchronously log request to MongoDB without blocking
      ApiRequestLog({
        ip_address: ip,
        method: req.method,
        endpoint: req.originalUrl || req.url,
        status_code: res.statusCode,
        response_time_ms: durationMs,
        content_length_bytes: contentLength,
        user_id: req.user?.id || req.user?.id_user || null,
        user_name: req.user?.nama || null,
        timestamp: new Date()
      }).catch(err => {
        // Silent catch for logger errors
        console.error('API Logger error:', err.message);
      });
    } catch (e) {
      // Ignore logger errors
    }
  });

  next();
};

export { apiLoggerMiddleware };