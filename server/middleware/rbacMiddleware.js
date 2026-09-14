// server/middleware/rbacMiddleware.js

/**
 * Middleware to check if user has one of the required roles
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // 1. Check if user is logged in (req.user is set by authMiddleware)
    if (!req.user || !req.user.roles) {
      return res.status(401).json({ message: 'Unauthorized: No user data found' });
    }

    // 2. Check if user has at least one of the allowed roles
    // req.user.roles is an array like ['admin'] or ['mahasiswa']
    const hasPermission = req.user.roles.some(role => allowedRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Forbidden: You do not have permission to perform this action' 
      });
    }

    // 3. Permission granted
    next();
  };
};

export default checkRole;