const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const { calculateNights, validateBookingDates } = require('../utils/dateHelpers');
const { generateBookingReference } = require('../utils/bookingReference');
const { checkRoomAvailability } = require('./availabilityService');

// Tax & Hospitality service rate: 12%
const TAX_RATE = 0.12;

/**
 * Creates a new booking with race-condition defense and backend pricing calculations
 */
const createBooking = async ({
  userId,
  hotelId,
  roomId,
  checkIn,
  checkOut,
  guests,
  guestDetails,
  status = 'pending',
  paymentStatus = 'pending',
  paymentProvider = 'razorpay'
}) => {
  // 1. Validate dates
  const dateValidation = validateBookingDates(checkIn, checkOut);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.message);
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = calculateNights(checkInDate, checkOutDate);

  if (nights < 1) {
    throw new Error('A reservation must be for at least one night');
  }

  // 2. Fetch room and hotel to enforce server-side truth
  const room = await Room.findById(roomId);
  if (!room) {
    throw new Error('Selected room was not found');
  }

  if (room.hotel.toString() !== hotelId.toString()) {
    throw new Error('Room does not belong to the selected hotel');
  }

  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new Error('Hotel not found');
  }

  // 3. Check guest capacity
  const totalGuests = (guests?.adults || 1) + (guests?.children || 0);
  if (room.capacity && room.capacity.totalGuests && totalGuests > room.capacity.totalGuests) {
    throw new Error(
      `Guest count (${totalGuests}) exceeds room maximum capacity of ${room.capacity.totalGuests}`
    );
  }

  // 4. Concurrency & Availability check: verify remaining available inventory
  const availability = await checkRoomAvailability(roomId, checkInDate, checkOutDate);
  if (!availability.isAvailable) {
    throw new Error('Sorry, this room is no longer available for the selected dates');
  }

  // 5. Server-side price calculation (never trust frontend totals)
  const pricePerNight = room.pricePerNight;
  const subtotal = Math.round(pricePerNight * nights * 100) / 100;
  const taxes = Math.round(subtotal * TAX_RATE * 100) / 100;
  const totalPrice = Math.round((subtotal + taxes) * 100) / 100;

  // 6. Generate unique booking reference
  let bookingReference = generateBookingReference();
  let existingRef = await Booking.findOne({ bookingReference });
  while (existingRef) {
    bookingReference = generateBookingReference();
    existingRef = await Booking.findOne({ bookingReference });
  }

  // 7. Atomic double-check & create booking
  // We re-query overlapping active bookings right before insertion to mitigate race conditions
  const overlappingActiveCount = await Booking.countDocuments({
    room: roomId,
    status: { $in: ['confirmed', 'pending'] },
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate }
  });

  if (overlappingActiveCount >= room.totalRooms) {
    throw new Error('All rooms of this type have just been booked for the requested dates');
  }

  const booking = await Booking.create({
    bookingReference,
    user: userId,
    hotel: hotelId,
    room: roomId,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: {
      adults: guests?.adults || 1,
      children: guests?.children || 0
    },
    nights,
    pricePerNight,
    subtotal,
    taxes,
    totalPrice,
    status,
    paymentStatus,
    paymentProvider,
    guestDetails: {
      fullName: guestDetails.fullName,
      email: guestDetails.email,
      phone: guestDetails.phone || '',
      specialRequests: guestDetails.specialRequests || ''
    }
  });

  return await Booking.findById(booking._id)
    .populate('hotel', 'name address city country images rating')
    .populate('room', 'name roomType beds amenities pricePerNight')
    .populate('user', 'name email');
};

/**
 * Cancels a booking with permission checks and status transitions
 */
const cancelBooking = async (bookingId, user, reason = '') => {
  const booking = await Booking.findById(bookingId)
    .populate('hotel', 'name city country')
    .populate('room', 'name');

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Check authorization: Must be the user who booked or an admin
  const isOwner = booking.user.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new Error('You are not authorized to cancel this booking');
  }

  if (booking.status === 'cancelled') {
    throw new Error('This booking is already cancelled');
  }

  if (booking.status === 'completed') {
    throw new Error('Completed bookings cannot be cancelled');
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancellationReason = reason || 'Cancelled by user';

  await booking.save();
  return booking;
};

module.exports = {
  TAX_RATE,
  createBooking,
  cancelBooking
};
