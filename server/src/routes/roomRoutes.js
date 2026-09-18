const express = require('express');
const router = express.Router();
const {
  getRoomsByHotel,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
} = require('../controllers/roomController');
const { roomCreateValidator } = require('../validators/roomValidator');
const validate = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Public routes
router.get('/hotel/:hotelId', getRoomsByHotel);
router.get('/:id', getRoomById);

// Admin-only routes
router.post('/', authenticate, requireRole('admin'), roomCreateValidator, validate, createRoom);
router.put('/:id', authenticate, requireRole('admin'), updateRoom);
router.delete('/:id', authenticate, requireRole('admin'), deleteRoom);

module.exports = router;
