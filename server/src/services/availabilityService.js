const Booking = require('../models/Booking');
const Room = require('../models/Room');

/**
 * Checks if a specific room is available for given check-in and check-out dates
 */
const checkRoomAvailability = async (roomId, checkIn, checkOut) => {
  const room = await Room.findById(roomId);
  if (!room) {
    throw new Error('Room not found');
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Count overlapping active bookings
  // Overlap: existing.checkIn < new.checkOut && existing.checkOut > new.checkIn
  const overlappingCount = await Booking.countDocuments({
    room: roomId,
    status: { $in: ['confirmed', 'pending'] },
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate }
  });

  const availableRooms = Math.max(0, room.totalRooms - overlappingCount);
  const isAvailable = availableRooms > 0;

  return {
    roomId: room._id,
    roomName: room.name,
    totalRooms: room.totalRooms,
    bookedRooms: overlappingCount,
    availableRooms,
    isAvailable
  };
};

/**
 * Gets availability for all rooms of a hotel for specified dates
 */
const getHotelRoomsAvailability = async (hotelId, checkIn, checkOut) => {
  const rooms = await Room.find({ hotel: hotelId });
  if (!rooms || rooms.length === 0) {
    return [];
  }

  if (!checkIn || !checkOut) {
    // If dates not specified, return rooms with base inventory
    return rooms.map((room) => ({
      ...room.toObject(),
      availableRooms: room.totalRooms,
      isAvailable: room.totalRooms > 0
    }));
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const roomAvailabilities = await Promise.all(
    rooms.map(async (room) => {
      const overlappingCount = await Booking.countDocuments({
        room: room._id,
        status: { $in: ['confirmed', 'pending'] },
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate }
      });

      const availableRooms = Math.max(0, room.totalRooms - overlappingCount);

      return {
        ...room.toObject(),
        bookedCount: overlappingCount,
        availableRooms,
        isAvailable: availableRooms > 0
      };
    })
  );

  return roomAvailabilities;
};

module.exports = {
  checkRoomAvailability,
  getHotelRoomsAvailability
};
