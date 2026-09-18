const User = require('../models/User');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { getDashboardStats, generateReports } = require('../services/analyticsService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get dashboard metrics and charts
 * @route   GET /api/admin/dashboard-stats
 * @access  Private (Admin)
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    return successResponse(res, 'Dashboard statistics retrieved', stats);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate admin business reports
 * @route   GET /api/admin/reports
 * @access  Private (Admin)
 */
const getReports = async (req, res, next) => {
  try {
    const { timeframe, startDate, endDate } = req.query;
    const reportData = await generateReports({ timeframe, startDate, endDate });
    return successResponse(res, 'Report generated successfully', reportData);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with search and booking summary
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 15 } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query)
    ]);

    // Attach booking counts
    const usersWithBookings = await Promise.all(
      users.map(async (u) => {
        const bookingCount = await Booking.countDocuments({ user: u._id });
        return {
          ...u.toObject(),
          bookingCount
        };
      })
    );

    return successResponse(res, 'Users retrieved', {
      users: usersWithBookings,
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
 * @desc    Update user role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private (Admin)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return errorResponse(res, 'Invalid role specified', [], 400);
    }

    // Prevent removing admin rights from self
    if (req.params.id === req.user._id.toString() && role !== 'admin') {
      return errorResponse(res, 'You cannot remove admin privileges from yourself', [], 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return errorResponse(res, 'User not found', [], 404);
    }

    return successResponse(res, `User role updated to ${role}`, { user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reviews for moderation
 * @route   GET /api/admin/reviews
 * @access  Private (Admin)
 */
const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find()
        .populate('user', 'name email avatar')
        .populate('hotel', 'name city country')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments()
    ]);

    return successResponse(res, 'All reviews retrieved', {
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

module.exports = {
  getStats,
  getReports,
  getUsers,
  updateUserRole,
  getAllReviews
};
