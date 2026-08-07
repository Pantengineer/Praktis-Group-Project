// server/middleware/apiRateLimiter.js
const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowsMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Terlalu banyak permintaan, coba lagi beberapa saat.' }
});

module.exports = { globalLimiter };