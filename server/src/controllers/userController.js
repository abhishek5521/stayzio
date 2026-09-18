const User = require('../models/User');
const Hotel = require('../models/Hotel');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get user favorite hotels
 * @route   GET /api/users/favorites
 * @access  Private
 */
const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      select: 'name description city country address images rating reviewCount priceFrom hotelType amenities'
    });

    return successResponse(res, 'Favorites retrieved', {
      favorites: user.favorites || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle hotel favorite status (add if absent, remove if present)
 * @route   POST /api/users/favorites/:hotelId
 * @access  Private
 */
const toggleFavorite = async (req, res, next) => {
  try {
    const { hotelId } = req.params;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return errorResponse(res, 'Hotel not found', [], 404);
    }

    const user = await User.findById(req.user._id);
    const index = user.favorites.indexOf(hotelId);
    let isFavorited = false;

    if (index > -1) {
      // Remove favorite
      user.favorites.splice(index, 1);
      isFavorited = false;
    } else {
      // Add favorite
      user.favorites.push(hotelId);
      isFavorited = true;
    }

    await user.save();

    return successResponse(
      res,
      isFavorited ? 'Hotel added to favorites' : 'Hotel removed from favorites',
      {
        hotelId,
        isFavorited,
        favorites: user.favorites
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  toggleFavorite
};
