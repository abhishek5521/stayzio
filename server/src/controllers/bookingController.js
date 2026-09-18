const Booking = require('../models/Booking');
const { createBooking, cancelBooking } = require('../services/bookingEngine');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private
 */
const handleCreateBooking = async (req, res, next) => {
  try {
    const { hotelId, roomId, checkIn, checkOut, guests, guestDetails } = req.body;

    const booking = await createBooking({
      userId: req.user._id,
      hotelId,
      roomId,
      checkIn,
      checkOut,
      guests,
      guestDetails
    });

    return successResponse(res, 'Booking confirmed successfully', { booking }, 201);
  } catch (error) {
    return errorResponse(res, error.message, [error.message], 400);
  }
};

/**
 * @desc    Get logged in user's bookings with filter
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { filter = 'all', page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };
    const today = new Date();

    if (filter === 'upcoming') {
      query.status = 'confirmed';
      query.checkIn = { $gte: today };
    } else if (filter === 'completed') {
      query.$or = [{ status: 'completed' }, { status: 'confirmed', checkOut: { $lt: today } }];
    } else if (filter === 'cancelled') {
      query.status = 'cancelled';
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('hotel', 'name address city country images rating')
        .populate('room', 'name roomType beds amenities pricePerNight')
        .sort({ checkIn: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query)
    ]);

    return successResponse(res, 'Bookings retrieved successfully', {
      bookings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('hotel', 'name address city country images rating latitude longitude')
      .populate('room', 'name roomType beds amenities pricePerNight totalRooms')
      .populate('user', 'name email phone');

    if (!booking) {
      return errorResponse(res, 'Booking not found', [], 404);
    }

    // Must be booking owner or admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'You are not authorized to view this booking', [], 403);
    }

    return successResponse(res, 'Booking retrieved successfully', { booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private
 */
const handleCancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await cancelBooking(req.params.id, req.user, reason);

    return successResponse(res, 'Booking cancelled successfully', { booking });
  } catch (error) {
    return errorResponse(res, error.message, [error.message], 400);
  }
};

/**
 * @desc    Get all bookings (Admin)
 * @route   GET /api/bookings/admin/all
 * @access  Private (Admin)
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 15 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { bookingReference: { $regex: term, $options: 'i' } },
        { 'guestDetails.fullName': { $regex: term, $options: 'i' } },
        { 'guestDetails.email': { $regex: term, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('hotel', 'name city country')
        .populate('room', 'name pricePerNight')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query)
    ]);

    return successResponse(res, 'All bookings retrieved', {
      bookings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleCreateBooking,
  getMyBookings,
  getBookingById,
  handleCancelBooking,
  getAllBookings
};
