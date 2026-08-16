// server/services/authService.js
import bcrypt from 'bcryptjs';
import pkg from 'jsonwebtoken';
import { User, Role, PraktikumUserRole } from '../models/sql/index.js';
import env from '../config/env.js';

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

export {
    login,
    getUserProfile,
}