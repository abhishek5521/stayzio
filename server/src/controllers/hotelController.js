const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get hotels with comprehensive filtering, sorting, pagination, and date availability
 * @route   GET /api/hotels
 * @access  Public
 */
const getHotels = async (req, res, next) => {
  try {
    const {
      destination,
      city,
      country,
      minPrice,
      maxPrice,
      rating,
      hotelType,
      amenities,
      checkIn,
      checkOut,
      guests,
      sort = 'recommended',
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    // Destination search (matches city, country, or hotel name)
    if (destination && destination.trim()) {
      const term = destination.trim();
      query.$or = [
        { city: { $regex: term, $options: 'i' } },
        { country: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } },
        { address: { $regex: term, $options: 'i' } }
      ];
    } else {
      if (city) {
        query.city = { $regex: `^${city.trim()}$`, $options: 'i' };
      }
      if (country) {
        query.country = { $regex: `^${country.trim()}$`, $options: 'i' };
      }
    }

    // Price range
    if (minPrice || maxPrice) {
      query.priceFrom = {};
      if (minPrice) query.priceFrom.$gte = Number(minPrice);
      if (maxPrice) query.priceFrom.$lte = Number(maxPrice);
    }

    // Star rating
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // Hotel types
    if (hotelType) {
      const types = Array.isArray(hotelType) ? hotelType : hotelType.split(',');
      query.hotelType = { $in: types };
    }

    // Amenities (all requested amenities must be present)
    if (amenities) {
      const amenitiesList = Array.isArray(amenities) ? amenities : amenities.split(',');
      query.amenities = { $all: amenitiesList };
    }

    // Date Availability Filtering
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      // Find all rooms that have capacity for the requested guests
      const roomQuery = {};
      if (guests && Number(guests) > 0) {
        roomQuery['capacity.totalGuests'] = { $gte: Number(guests) };
      }

      const allRooms = await Room.find(roomQuery).select('_id hotel totalRooms');

      // Find overlapping bookings for these rooms
      const overlappingBookings = await Booking.aggregate([
        {
          $match: {
            status: { $in: ['confirmed', 'pending'] },
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
          }
        },
        {
          $group: {
            _id: '$room',
            bookedCount: { $sum: 1 }
          }
        }
      ]);

      const bookedCountMap = {};
      overlappingBookings.forEach((b) => {
        bookedCountMap[b._id.toString()] = b.bookedCount;
      });

      // Filter rooms that have remaining capacity
      const availableHotelIds = new Set();
      allRooms.forEach((room) => {
        const booked = bookedCountMap[room._id.toString()] || 0;
        if (room.totalRooms > booked) {
          availableHotelIds.add(room.hotel.toString());
        }
      });

      // Restrict hotel query to hotels with at least one available room
      query._id = { $in: Array.from(availableHotelIds) };
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { priceFrom: 1 };
        break;
      case 'price_desc':
        sortOption = { priceFrom: -1 };
        break;
      case 'rating_desc':
        sortOption = { rating: -1, reviewCount: -1 };
        break;
      case 'popular':
        sortOption = { reviewCount: -1, rating: -1 };
        break;
      case 'recommended':
      default:
        sortOption = { featured: -1, rating: -1, reviewCount: -1 };
        break;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [hotels, total] = await Promise.all([
      Hotel.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Hotel.countDocuments(query)
    ]);

    return successResponse(res, 'Hotels retrieved successfully', {
      hotels,
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
 * @desc    Get featured hotels
 * @route   GET /api/hotels/featured
 * @access  Public
 */
const getFeaturedHotels = async (req, res, next) => {
  try {
    const hotels = await Hotel.find({ featured: true }).limit(8).sort({ rating: -1 });
    return successResponse(res, 'Featured hotels retrieved', { hotels });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get popular destinations
 * @route   GET /api/hotels/destinations
 * @access  Public
 */
const getPopularDestinations = async (req, res, next) => {
  try {
    const destinations = await Hotel.aggregate([
      {
        $group: {
          _id: { city: '$city', country: '$country' },
          hotelCount: { $sum: 1 },
          lowestPrice: { $min: '$priceFrom' },
          sampleImage: { $first: { $arrayElemAt: ['$images', 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          city: '$_id.city',
          country: '$_id.country',
          hotelCount: 1,
          lowestPrice: 1,
          image: '$sampleImage'
        }
      },
      { $sort: { hotelCount: -1 } },
      { $limit: 8 }
    ]);

    return successResponse(res, 'Popular destinations retrieved', { destinations });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single hotel by ID with rooms and reviews
 * @route   GET /api/hotels/:id
 * @access  Public
 */
const getHotelById = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate({
        path: 'rooms',
        select: 'name description roomType pricePerNight capacity beds amenities images totalRooms'
      })
      .populate({
        path: 'reviews',
        populate: {
          path: 'user',
          select: 'name avatar'
        },
        options: { sort: { createdAt: -1 } }
      });

    if (!hotel) {
      return errorResponse(res, 'Hotel not found', [], 404);
    }

    return successResponse(res, 'Hotel details retrieved', { hotel });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new hotel
 * @route   POST /api/hotels
 * @access  Private (Admin)
 */
const createHotel = async (req, res, next) => {
  try {
    const {
      name,
      description,
      address,
      city,
      country,
      latitude,
      longitude,
      images,
      amenities,
      hotelType,
      priceFrom,
      featured
    } = req.body;

    const hotel = await Hotel.create({
      name,
      description,
      address,
      city,
      country,
      latitude: Number(latitude),
      longitude: Number(longitude),
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)]
      },
      images,
      amenities: amenities || [],
      hotelType: hotelType || 'hotel',
      priceFrom: Number(priceFrom),
      featured: Boolean(featured)
    });

    return successResponse(res, 'Hotel created successfully', { hotel }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update hotel
 * @route   PUT /api/hotels/:id
 * @access  Private (Admin)
 */
const updateHotel = async (req, res, next) => {
  try {
    let hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return errorResponse(res, 'Hotel not found', [], 404);
    }

    if (req.body.latitude && req.body.longitude) {
      req.body.location = {
        type: 'Point',
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)]
      };
    }

    hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    return successResponse(res, 'Hotel updated successfully', { hotel });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete hotel
 * @route   DELETE /api/hotels/:id
 * @access  Private (Admin)
 */
const deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return errorResponse(res, 'Hotel not found', [], 404);
    }

    // Cascade delete associated rooms and reviews
    await Promise.all([
      Room.deleteMany({ hotel: hotel._id }),
      Hotel.findByIdAndDelete(req.params.id)
    ]);

    return successResponse(res, 'Hotel and associated rooms removed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHotels,
  getFeaturedHotels,
  getPopularDestinations,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel
};
