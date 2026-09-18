const express = require('express');
const router = express.Router();
const {
  handleCreateBooking,
  getMyBookings,
  getBookingById,
  handleCancelBooking,
  getAllBookings
} = require('../controllers/bookingController');
const { bookingCreateValidator, bookingCancelValidator } = require('../validators/bookingValidator');
const validate = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.post('/', bookingCreateValidator, validate, handleCreateBooking);
router.get('/my-bookings', getMyBookings);
router.get('/admin/all', requireRole('admin'), getAllBookings);
router.get('/:id', getBookingById);
router.put('/:id/cancel', bookingCancelValidator, validate, handleCancelBooking);

module.exports = router;
