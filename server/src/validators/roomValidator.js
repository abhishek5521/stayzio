const { body } = require('express-validator');

const roomCreateValidator = [
  body('hotel')
    .notEmpty()
    .withMessage('Hotel ID is required')
    .isMongoId()
    .withMessage('Invalid Hotel ID format'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Room name is required'),
  body('roomType')
    .optional()
    .isIn(['standard', 'deluxe', 'suite', 'executive', 'penthouse', 'family'])
    .withMessage('Invalid room type'),
  body('pricePerNight')
    .notEmpty()
    .withMessage('Price per night is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('totalRooms')
    .notEmpty()
    .withMessage('Total rooms inventory count is required')
    .isInt({ min: 1 })
    .withMessage('Total rooms must be at least 1'),
  body('capacity.adults')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Adults capacity must be at least 1'),
  body('capacity.children')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Children capacity cannot be negative'),
  body('capacity.totalGuests')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total capacity must be at least 1')
];

module.exports = {
  roomCreateValidator
};
