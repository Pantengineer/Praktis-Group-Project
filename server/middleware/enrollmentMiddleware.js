// server/middleware/enrollmentMiddleware.js
import { PraktikumUserRole, Role, Pertemuan } from '../models/sql/index.js';

/**
 * Ensures user is enrolled in the class linked to the request.
 * Can check via 'id_praktikum' (URL param) OR 'pertemuan_id' (Body/Query).
 * @param {string[]} requiredRoles - e.g. ['asdos'] or ['mahasiswa', 'asdos']
 */
const checkEnrollment = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      let praktikumId = req.params.id_praktikum || req.body.id_praktikum;
      
      // If we only have a 'pertemuan_id' (like in Task creation), resolve it to a Class ID
      if (!praktikumId && (req.body.pertemuan_id || req.params.pertemuan_id)) {
        const pId = req.body.pertemuan_id || req.params.pertemuan_id;
        const session = await Pertemuan.findByPk(pId);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        praktikumId = session.id_praktikum;
      }

      if (!praktikumId) {
        return res.status(400).json({ message: 'Context Error: Could not determine Class ID' });
      }

      // Check DB
      const enrollment = await PraktikumUserRole.findOne({
        where: { id_user: req.user.id, id_praktikum: praktikumId },
        include: [{ model: Role }]
      });

      if (!enrollment) {
        // Allow Global Admins to bypass
        if (req.user.roles.includes('admin')) return next();
        return res.status(403).json({ message: 'You are not enrolled in this class' });
      }

      // Check Specific Role (e.g., Must be Asdos)
      if (requiredRoles.length > 0) {
        const userRoleInClass = enrollment.Role.deskripsi; // 'asdos' or 'mahasiswa'
        if (!requiredRoles.includes(userRoleInClass) && !req.user.roles.includes('admin')) {
           return res.status(403).json({ message: `Requires role: ${requiredRoles.join(' or ')}` });
        }
      }

      // Attach context for the controller to use
      req.currentClassRole = enrollment.Role.deskripsi;
      next();

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Enrollment check failed' });
    }
  };
};

export default {
  checkEnrollment,
}