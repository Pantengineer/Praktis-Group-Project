import { User } from '../../models/sql/index.js';
import UserSession from '../../models/nosql/UserSession.js';
import BannedIP from '../../models/nosql/BannedIP.js';

const getActiveSessions = async () => {
  const sixtyMinsAgo = new Date(Date.now() - 60 * 60 * 1000);
  const sessions = await UserSession.find({ last_active: { $gte: sixtyMinsAgo } }).sort({ last_active: -1 });
  const bannedIps = await BannedIP.find({});
  const bannedIpSet = new Set(bannedIps.map(b => b.ip_address));

  // Enrich with SQL User info
  const userIds = Array.from(new Set(sessions.map(s => s.user_id).filter(Boolean)));
  const users = await User.findAll({
    where: { id_user: userIds },
    attributes: ['id_user', 'nama', 'email', 'nim']
  });
  const userMap = {};
  users.forEach(u => { userMap[u.id_user] = u; });

  const activeList = sessions.map(s => {
    const u = userMap[s.user_id];
    return {
      id: s._id,
      ip_address: s.ip_address,
      user_id: s.user_id,
      user_name: u ? u.nama : (s.user_name || 'Tamu / Guest'),
      user_email: u ? u.email : (s.user_email || '-'),
      user_nim: u ? u.nim : '-',
      user_roles: s.user_roles || [],
      user_agent: s.user_agent || 'Unknown',
      last_active: s.last_active,
      is_banned: bannedIpSet.has(s.ip_address)
    };
  });

  return { activeSessions: activeList };
};

const getBannedIps = async () => {
    const bannedIps = await BannedIP.find({}).sort({ banned_at: -1 });
    return { bannedIps };
};

const banIp = async ({ ip_address, reason, durationMinutes, is_permanent, adminIP, userId } ) => {
    if (!ip_address) throw { status: 400, message: 'Alamat IP wajib diisi.' };

    // Self-ban protection: prevent admin from banning their own IP or localhost
    if (ip_address === adminIP || ip_address === '127.0.0.1' || ip_address === '::1' || ip_address === '::ffff:127.0.0.1') {
      throw {
        status: 400,
        message: 'Perlindungan Sistem: Anda tidak dapat memblokir IP aktif Anda sendiri atau IP loopback (localhost).'
      };
    }

    const adminUser = await User.findByPk(userId);
    const adminName = adminUser ? adminUser.nama : 'Administrator';

    let expiresAt = null;
    if (!is_permanent && durationMinutes) {
      expiresAt = new Date(Date.now() + parseInt(durationMinutes) * 60 * 1000);
    }

    const bannedRecord = await BannedIP.findOneAndUpdate(
      { ip_address },
      {
        ip_address,
        reason: reason || 'Dilarang oleh Administrator',
        banned_by: userId,
        banned_by_name: adminName,
        banned_at: new Date(),
        expires_at: expiresAt,
        is_permanent: !!is_permanent
      },
      { upsert: true, returnDocument: 'after' }
    );

    return { message: `Alamat IP ${ip_address} berhasil diblokir.`, bannedRecord };
};

const unbanIp = async (ip_address) => {
    if (!ip_address) throw { status: 400, message: 'Alamat IP wajib diisi.' };

    await BannedIP.deleteOne({ ip_address });
    return { message: `Alamat IP ${ip_address} berhasil dibuka pemblokirannya (unbanned).` };
};

export default {
  getActiveSessions,
  getBannedIps,
  banIp,
  unbanIp,
};