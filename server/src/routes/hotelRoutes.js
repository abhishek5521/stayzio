const express = require('express');
const router = express.Router();
const {
  getHotels,
  getFeaturedHotels,
  getPopularDestinations,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel
} = require('../controllers/hotelController');
const { hotelCreateValidator, hotelQueryValidator } = require('../validators/hotelValidator');
const validate = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Public routes
router.get('/', hotelQueryValidator, validate, getHotels);
router.get('/featured', getFeaturedHotels);
router.get('/destinations', getPopularDestinations);
router.get('/:id', getHotelById);

// Admin-only routes
router.post('/', authenticate, requireRole('admin'), hotelCreateValidator, validate, createHotel);
router.put('/:id', authenticate, requireRole('admin'), updateHotel);
router.delete('/:id', authenticate, requireRole('admin'), deleteHotel);

module.exports = router;
