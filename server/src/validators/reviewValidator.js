const { body } = require('express-validator');

const reviewCreateValidator = [
  body('hotelId')
    .notEmpty()
    .withMessage('Hotel ID is required')
    .isMongoId()
    .withMessage('Invalid Hotel ID format'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Review comment must be between 5 and 1000 characters'),
  body('bookingId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Booking ID format')
];

module.exports = {
  reviewCreateValidator
};
