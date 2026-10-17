import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import pkg from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User, Role, PraktikumUserRole, PasswordReset } from '../models/sql/index.js';
import env from '../config/env.js';
import { sendPasswordResetEmail } from './emailService.js';

const { sign } = pkg;

const resolveUserRoles = async (user) => {
    let roles = user.Roles.map(r => r.deskripsi);

    const isAsdos = await PraktikumUserRole.findOne({
        where: { id_user: user.id_user },
        include: [{ model: Role, where: { deskripsi: 'asdos' } }]
    });

    if (isAsdos && !roles.includes('asdos')) {
        roles.push('asdos');
    }

    return roles;
};

const login = async (email, password) => {
    const user = await User.findOne({
        where: { email },
        include: [{
            model: Role,
            through: { attributes: [] }
        }]
    });

    if (!user) throw new Error('INVALID_CREDENTIALS');

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) throw new Error('INVALID_CREDENTIALS');

    const roles = await resolveUserRoles(user);

    const token = sign(
        { id: user.id_user, roles: roles },
        env.jwtSecret,
        { expiresIn: '24h' }
    );

    return {
        token,
        userPayload: {
            id: user.id_user,
            nama: user.nama,
            email: user.email,
            roles: roles
        }
    };
};

const getUserProfile = async (userId) => {
    const user = await User.findByPk(userId, {
        include: [{ model: Role, through: { attributes: [] } }]
    });

    if (!user) throw new Error('USER_NOT_FOUND');

    const roles = await resolveUserRoles(user);

    return {
        id: user.id_user,
        nama: user.nama,
        email: user.email,
        roles: roles
    };
};

/**
 * Request password reset token and dispatch email
 * @param {string} email 
 */
const requestPasswordReset = async (email) => {
    const user = await User.findOne({ where: { email } });

    // Anti-enumeration: return identical success message even if email is not found
    if (!user) {
        return { message: 'Jika email Anda terdaftar, instruksi reset kata sandi telah dikirimkan.' };
    }

    // Generate cryptographically secure random token (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Invalidate existing active tokens for this user
    await PasswordReset.update(
        { is_used: true },
        { where: { id_user: user.id_user, is_used: false } }
    );

    // Save token with 15-minute expiration
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await PasswordReset.create({
        id_user: user.id_user,
        token: hashedToken,
        expires_at: expiresAt,
        is_used: false,
    });

    // Send email via emailService
    await sendPasswordResetEmail(user.email, user.nama, rawToken);

    return { message: 'Jika email Anda terdaftar, instruksi reset kata sandi telah dikirimkan.' };
};

/**
 * Verify validity of a password reset token
 * @param {string} rawToken 
 */
const verifyResetToken = async (rawToken) => {
    if (!rawToken) {
        throw new Error('TOKEN_REQUIRED');
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const record = await PasswordReset.findOne({
        where: {
            token: hashedToken,
            is_used: false,
            expires_at: { [Op.gt]: new Date() }
        },
        include: [{
            model: User,
            attributes: ['id_user', 'nama', 'email']
        }]
    });

    if (!record) {
        throw new Error('INVALID_OR_EXPIRED_TOKEN');
    }

    return {
        valid: true,
        user: {
            nama: record.User.nama,
            email: record.User.email,
        }
    };
};

/**
 * Reset password using valid token
 * @param {string} rawToken 
 * @param {string} newPassword 
 */
const resetPassword = async (rawToken, newPassword) => {
    if (!rawToken || !newPassword) {
        throw new Error('MISSING_FIELDS');
    }

    if (newPassword.length < 6) {
        throw new Error('PASSWORD_TOO_SHORT');
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const record = await PasswordReset.findOne({
        where: {
            token: hashedToken,
            is_used: false,
            expires_at: { [Op.gt]: new Date() }
        }
    });

    if (!record) {
        throw new Error('INVALID_OR_EXPIRED_TOKEN');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.update(
        { password: hashedPassword },
        { where: { id_user: record.id_user } }
    );

    // Invalidate token
    await record.update({ is_used: true });

    return { message: 'Kata sandi berhasil diperbarui. Silakan login kembali dengan kata sandi baru Anda.' };
};

export {
    login,
    getUserProfile,
    requestPasswordReset,
    verifyResetToken,
    resetPassword,
};