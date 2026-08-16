// server/middleware/ipBanMiddleware.js
import BannedIP from '../models/nosql/BannedIP.js';

const extractClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    if (ips[0]) return ips[0];
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
};

const ipBanMiddleware = async (req, res, next) => {
  try {
    const clientIP = extractClientIP(req);

    // Check if IP is in ban database
    const banRecord = await BannedIP.findOne({ ip_address: clientIP });

    if (banRecord) {
      // Check if ban is permanent or still active
      const now = new Date();
      if (banRecord.is_permanent || (banRecord.expires_at && new Date(banRecord.expires_at) > now)) {
        return res.status(403).json({
          message: `Akses dari IP (${clientIP}) telah diblokir oleh Administrator. Alasan: ${banRecord.reason}`,
          isBanned: true,
          reason: banRecord.reason,
          expiresAt: banRecord.expires_at
        });
      }

      // If ban expired, clean up automatically
      if (banRecord.expires_at && new Date(banRecord.expires_at) <= now) {
        await BannedIP.deleteOne({ _id: banRecord._id });
      }
    }

    next();
  } catch (error) {
    console.error('IP Ban Middleware Error:', error);
    next(); // Pass through on unexpected DB errors
  }
};

export { ipBanMiddleware, extractClientIP };
