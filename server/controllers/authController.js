// server/controllers/authController.js
import { login as loginService, getUserProfile } from '../services/authService.js';
import logger from '../utils/logger.js';

// Cookie configuration 
const COOKIE_NAME = 'auth_token';
const COOKIE_OPTIONS = {
  httpOnly: true,       // Mitigates XSS token theft
  secure: process.env.NODE_ENV === 'production',   // HTTPS only in production
  sameSite: 'strict',  // CSRF mitigation
  maxAge: 24 * 60 * 60 * 1000  // 24 hours in ms
};

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const { token, userPayload } = await loginService(email, password);

    // Set token as HttpOnly cookie
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    res.json({
      message: 'Login successful',
      token,
      user: userPayload
    });

  } catch (error) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    logger.error('Login Error:', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
}

// 2.1: Logout — clears the HttpOnly cookie server-side
function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ message: 'Logged out successfully' });
}

async function me(req, res) {
  try {
    const userPayload = await getUserProfile(req.user.id);

    res.json({ user: userPayload });
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'User not found' });
    }
    logger.error('Me endpoint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export default {
  login,
  logout,
  me,
}