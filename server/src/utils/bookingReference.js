const crypto = require('crypto');

/**
 * Generates an enterprise-grade, human-readable booking reference.
 * Format: STZ-YYYYMMDD-XXXXX
 * Example: STZ-20260905-9B7C2
 */
const generateBookingReference = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
  return `STZ-${dateStr}-${randomSuffix}`;
};

module.exports = { generateBookingReference };
