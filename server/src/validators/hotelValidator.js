const { body, query } = require('express-validator');

const hotelCreateValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Hotel name is required')
    .isLength({ max: 120 })
    .withMessage('Hotel name cannot exceed 120 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Hotel description is required'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Hotel address is required'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('images')
    .isArray({ min: 1 })
    .withMessage('At least one hotel image URL is required'),
  body('images.*')
    .isURL()
    .withMessage('Each image must be a valid URL'),
  body('hotelType')
    .optional()
    .isIn(['hotel', 'resort', 'villa', 'apartment', 'boutique', 'cabin'])
    .withMessage('Invalid hotel type'),
  body('priceFrom')
    .notEmpty()
    .withMessage('Price from is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array of strings')
];

const hotelQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a non-negative number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a non-negative number'),
  query('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  query('sort')
    .optional()
    .isIn(['recommended', 'price_asc', 'price_desc', 'rating_desc', 'popular'])
    .withMessage('Invalid sort parameter')
];

module.exports = {
  hotelCreateValidator,
  hotelQueryValidator
};
