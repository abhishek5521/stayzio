const express = require('express');
const router = express.Router();
const {
  getReviewsByHotel,
  createReview,
  getUserReviews,
  deleteReview
} = require('../controllers/reviewController');
const { reviewCreateValidator } = require('../validators/reviewValidator');
const validate = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');

// Public
router.get('/hotel/:hotelId', getReviewsByHotel);

// Private
router.get('/my-reviews', authenticate, getUserReviews);
router.post('/', authenticate, reviewCreateValidator, validate, createReview);
router.delete('/:id', authenticate, deleteReview);

module.exports = router;
