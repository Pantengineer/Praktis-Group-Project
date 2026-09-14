// server/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// Global API Limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Terlalu banyak request. Mohon pelan-pelan...' }
});

// Auth/Login Limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Terlalu banyak percobaan untuk login dari IP anda. Mohon coba lagi setelah 15 menit.' }
})

// Upload Limiter
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // Max 10 uploads per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Batas percobaan unggah terlampaui. Maksimal 10 unggahan per 15 menit. Silakan tunggu beberapa saat.' }
});

export {
    globalLimiter,
    loginLimiter,
    uploadLimiter,
}