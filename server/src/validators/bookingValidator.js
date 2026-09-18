const { body } = require('express-validator');

const bookingCreateValidator = [
  body('hotelId')
    .notEmpty()
    .withMessage('Hotel ID is required')
    .isMongoId()
    .withMessage('Invalid Hotel ID format'),
  body('roomId')
    .notEmpty()
    .withMessage('Room ID is required')
    .isMongoId()
    .withMessage('Invalid Room ID format'),
  body('checkIn')
    .notEmpty()
    .withMessage('Check-in date is required')
    .isISO8601()
    .withMessage('Check-in must be a valid ISO8601 date'),
  body('checkOut')
    .notEmpty()
    .withMessage('Check-out date is required')
    .isISO8601()
    .withMessage('Check-out must be a valid ISO8601 date'),
  body('guests.adults')
    .optional()
    .isInt({ min: 1 })
    .withMessage('At least 1 adult is required'),
  body('guestDetails.fullName')
    .trim()
    .notEmpty()
    .withMessage('Primary guest full name is required'),
  body('guestDetails.email')
    .trim()
    .notEmpty()
    .withMessage('Primary guest email is required')
    .isEmail()
    .withMessage('Guest email must be valid')
    .normalizeEmail(),
  body('guestDetails.phone')
    .optional()
    .trim()
];

const bookingCancelValidator = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Cancellation reason cannot exceed 300 characters')
];

module.exports = {
  bookingCreateValidator,
  bookingCancelValidator
};
