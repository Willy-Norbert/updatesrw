const ApiError = require('../utils/ApiError');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You are not authorized to perform this action'));
    }
    next();
  };
}

const requireAdmin = requireRole('ADMIN');
const requireChiefEditor = requireRole('ADMIN', 'CHIEF_EDITOR');

module.exports = { requireRole, requireAdmin, requireChiefEditor };
