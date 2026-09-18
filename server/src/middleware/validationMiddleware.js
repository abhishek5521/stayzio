const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware that inspects express-validator results and sends 400 with details if invalid
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    return errorResponse(res, 'Validation failed for submitted data', formattedErrors, 400);
  }
  next();
};

module.exports = validate;
