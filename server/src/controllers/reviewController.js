const Review = require('../models/Review');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get reviews for a hotel
 * @route   GET /api/reviews/hotel/:hotelId
 * @access  Public
 */
const getReviewsByHotel = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find({ hotel: hotelId })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments({ hotel: hotelId })
    ]);

    return successResponse(res, 'Reviews retrieved', {
      reviews,
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
 * @desc    Create a new review
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = async (req, res, next) => {
  try {
    const { hotelId, rating, comment, bookingId } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return errorResponse(res, 'Hotel not found', [], 404);
    }

    // Check if user already reviewed with this booking
    if (bookingId) {
      const existingReview = await Review.findOne({
        user: req.user._id,
        booking: bookingId
      });
      if (existingReview) {
        return errorResponse(res, 'You have already submitted a review for this booking', [], 400);
      }
    } else {
      const existingReview = await Review.findOne({
        user: req.user._id,
        hotel: hotelId
      });
      if (existingReview) {
        return errorResponse(res, 'You have already submitted a review for this hotel', [], 400);
      }
    }

    const review = await Review.create({
      user: req.user._id,
      hotel: hotelId,
      booking: bookingId || null,
      rating: Number(rating),
      comment
    });

    const populatedReview = await Review.findById(review._id).populate('user', 'name avatar');

    return successResponse(res, 'Review submitted successfully', { review: populatedReview }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's reviews
 * @route   GET /api/reviews/my-reviews
 * @access  Private
 */
const getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('hotel', 'name city country images')
      .sort({ createdAt: -1 });

    return successResponse(res, 'User reviews retrieved', { reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return errorResponse(res, 'Review not found', [], 404);
    }

    // Check ownership or admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'You are not authorized to delete this review', [], 403);
    }

    await Review.findOneAndDelete({ _id: req.params.id });

    return successResponse(res, 'Review removed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviewsByHotel,
  createReview,
  getUserReviews,
  deleteReview
};
