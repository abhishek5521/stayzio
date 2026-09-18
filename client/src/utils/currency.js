/**
 * Stayzio Currency Utilities
 * Formats monetary amounts in Indian Rupee (INR - ₹) using standard Indian numbering system (e.g. ₹4,999, ₹1,25,000).
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const inrDecimalFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * Format a number as Indian Rupee currency (₹)
 * @param {number|string} amount - Monetary amount to format
 * @param {object} [options] - Intl.NumberFormat options override
 * @returns {string} Formatted INR string, e.g. "₹4,999" or "₹1,25,000"
 */
export const formatINR = (amount, options = {}) => {
  const num = Number(amount);
  if (isNaN(num) || amount === null || amount === undefined) {
    return '₹0';
  }

  if (options && Object.keys(options).length > 0) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      ...options
    }).format(num);
  }

  if (num % 1 !== 0) {
    return inrDecimalFormatter.format(num);
  }

  return inrFormatter.format(num);
};

/**
 * Compact INR format for short labels, e.g. ₹12.5k, ₹1.5L
 * @param {number|string} amount
 * @returns {string}
 */
export const formatINRCompact = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(1)}Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`;
  }
  if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)}k`.replace('.0k', 'k');
  }
  return `₹${num}`;
};

export default formatINR;
