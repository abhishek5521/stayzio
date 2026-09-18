const { errorResponse } = require('../utils/apiResponse');

/**
 * Grant access to specific roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before checking permissions', [], 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `User role '${req.user.role}' is not authorized to access this route`,
        [],
        403
      );
    }
    next();
  };
};

module.exports = { requireRole };
