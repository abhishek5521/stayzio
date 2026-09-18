const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const { getHotelRoomsAvailability } = require('../services/availabilityService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Helper to update hotel priceFrom to the minimum price among its rooms
 */
const updateHotelPriceFrom = async (hotelId) => {
  const lowestRoom = await Room.findOne({ hotel: hotelId }).sort({ pricePerNight: 1 });
  if (lowestRoom) {
    await Hotel.findByIdAndUpdate(hotelId, { priceFrom: lowestRoom.pricePerNight });
  }
};

/**
 * @desc    Get all rooms for a hotel with dynamic date availability
 * @route   GET /api/rooms/hotel/:hotelId
 * @access  Public
 */
const getRoomsByHotel = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { checkIn, checkOut } = req.query;

    const rooms = await getHotelRoomsAvailability(hotelId, checkIn, checkOut);

    return successResponse(res, 'Rooms retrieved successfully', { rooms });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single room by ID
 * @route   GET /api/rooms/:id
 * @access  Public
 */
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate('hotel', 'name city country');
    if (!room) {
      return errorResponse(res, 'Room not found', [], 404);
    }
    return successResponse(res, 'Room retrieved successfully', { room });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a room
 * @route   POST /api/rooms
 * @access  Private (Admin)
 */
const createRoom = async (req, res, next) => {
  try {
    const { hotel: hotelId, name, description, roomType, pricePerNight, capacity, beds, amenities, images, totalRooms } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return errorResponse(res, 'Hotel not found', [], 404);
    }

    const room = await Room.create({
      hotel: hotelId,
      name,
      description: description || '',
      roomType: roomType || 'standard',
      pricePerNight: Number(pricePerNight),
      capacity: {
        adults: capacity?.adults || 2,
        children: capacity?.children || 0,
        totalGuests: capacity?.totalGuests || 2
      },
      beds: {
        count: beds?.count || 1,
        type: beds?.type || 'King Bed'
      },
      amenities: amenities || [],
      images: images || [],
      totalRooms: totalRooms ? Number(totalRooms) : 5
    });

    await updateHotelPriceFrom(hotelId);

    return successResponse(res, 'Room created successfully', { room }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a room
 * @route   PUT /api/rooms/:id
 * @access  Private (Admin)
 */
const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!room) {
      return errorResponse(res, 'Room not found', [], 404);
    }

    await updateHotelPriceFrom(room.hotel);

    return successResponse(res, 'Room updated successfully', { room });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a room
 * @route   DELETE /api/rooms/:id
 * @access  Private (Admin)
 */
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return errorResponse(res, 'Room not found', [], 404);
    }

    const hotelId = room.hotel;
    await Room.findByIdAndDelete(req.params.id);

    await updateHotelPriceFrom(hotelId);

    return successResponse(res, 'Room deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoomsByHotel,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};
