// server/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

import { extractClientIP } from './ipBanMiddleware.js';
import UserSession from '../models/nosql/UserSession.js';

const verifyToken = (req, res, next) => {
  // 2.1: Check both HttpOnly cookie AND Authorization header.
  // Cookie takes priority (more secure); header is kept for backward compatibility.
  const tokenFromCookie = req.cookies?.auth_token;
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No token provided' });
  }

  try {
    const verified = jwt.verify(token, env.jwtSecret);
    req.user = verified;

    // Asynchronously log/update active IP session without blocking response
    const clientIP = extractClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    UserSession.findOneAndUpdate(
      { ip_address: clientIP, user_id: verified.id },
      {
        ip_address: clientIP,
        user_id: verified.id,
        user_roles: verified.roles || [],
        user_agent: userAgent,
        last_active: new Date()
      },
      { upsert: true, returnDocument: 'after' }
    ).catch(err => console.error('Session log error:', err));

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default verifyToken;