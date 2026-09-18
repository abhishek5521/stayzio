/**
 * Date utility functions for booking calculations and overlap verification
 */

/**
 * Calculates number of nights between check-in and check-out dates
 */
const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

/**
 * Validates check-in and check-out dates
 * - checkIn >= today (midnight)
 * - checkOut > checkIn
 */
const validateBookingDates = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, message: 'Invalid check-in or check-out date format' };
  }

  // Allow today's check-in
  const startMidnight = new Date(start);
  startMidnight.setHours(0, 0, 0, 0);

  if (startMidnight < today) {
    return { valid: false, message: 'Check-in date cannot be in the past' };
  }

  if (end <= start) {
    return { valid: false, message: 'Check-out date must be after check-in date' };
  }

  return { valid: true };
};

/**
 * Checks if two date intervals overlap
 * Overlap condition: startA < endB && endA > startB
 */
const doDatesOverlap = (startA, endA, startB, endB) => {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
};

module.exports = {
  calculateNights,
  validateBookingDates,
  doDatesOverlap
};
