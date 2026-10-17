// server/controllers/authController.js
import {
  login as loginService,
  getUserProfile,
  requestPasswordReset,
  verifyResetToken as verifyResetTokenService,
  resetPassword as resetPasswordService
} from '../services/authService.js';
import logger from '../utils/logger.js';

// Cookie configuration 
const COOKIE_NAME = 'auth_token';
const COOKIE_OPTIONS = {
  httpOnly: true,       // Mitigates XSS token theft
  secure: process.env.NODE_ENV === 'production',   // HTTPS only in production
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Alamat email wajib diisi.' });
    }

    const result = await requestPasswordReset(email.trim());
    return res.json(result);
  } catch (error) {
    logger.error('Forgot password error:', { error: error.message });
    return res.status(500).json({ message: 'Gagal memproses permintaan reset password.' });
  }
}

async function verifyResetToken(req, res) {
  try {
    const { token } = req.params;
    const result = await verifyResetTokenService(token);
    return res.json(result);
  } catch (error) {
    if (error.message === 'INVALID_OR_EXPIRED_TOKEN' || error.message === 'TOKEN_REQUIRED') {
      return res.status(400).json({ message: 'Tautan reset password tidak valid atau sudah kedaluwarsa.' });
    }
    logger.error('Verify reset token error:', { error: error.message });
    return res.status(500).json({ message: 'Gagal memverifikasi token reset.' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token dan kata sandi baru wajib disertakan.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Kata sandi minimal harus terdiri dari 6 karakter.' });
    }

    const result = await resetPasswordService(token, newPassword);
    return res.json(result);
  } catch (error) {
    if (error.message === 'INVALID_OR_EXPIRED_TOKEN') {
      return res.status(400).json({ message: 'Tautan reset password tidak valid atau sudah kedaluwarsa.' });
    }
    if (error.message === 'PASSWORD_TOO_SHORT') {
      return res.status(400).json({ message: 'Kata sandi minimal harus terdiri dari 6 karakter.' });
    }
    logger.error('Reset password error:', { error: error.message });
    return res.status(500).json({ message: 'Gagal memperbarui kata sandi.' });
  }
}

export default {
  login,
  logout,
  me,
  forgotPassword,
  verifyResetToken,
  resetPassword,
};