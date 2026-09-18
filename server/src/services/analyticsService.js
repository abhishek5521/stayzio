const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

/**
 * Aggregates high-level platform statistics for Admin Dashboard
 */
const getDashboardStats = async () => {
  const [
    totalUsers,
    totalHotels,
    totalRooms,
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    completedBookings,
    totalReviews,
    paidBookings,
    pendingPayments,
    failedPayments,
    refundedPayments
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Hotel.countDocuments(),
    Room.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'cancelled' }),
    Booking.countDocuments({ status: 'completed' }),
    Review.countDocuments(),
    Booking.countDocuments({ paymentStatus: 'paid' }),
    Booking.countDocuments({ paymentStatus: 'pending' }),
    Booking.countDocuments({ paymentStatus: 'failed' }),
    Booking.countDocuments({ paymentStatus: 'refunded' })
  ]);

  // Aggregate total platform revenue strictly based on verified paid bookings
  const revenueAggregation = await Booking.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalPrice' },
        avgBookingValue: { $avg: '$totalPrice' }
      }
    }
  ]);

  const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;
  const avgBookingValue = Math.round((revenueAggregation[0]?.avgBookingValue || 0) * 100) / 100;

  // Monthly revenue and booking trends (past 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyTrends = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        bookings: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$paymentStatus', 'paid'] }, { $ne: ['$status', 'cancelled'] }] },
              '$totalPrice',
              0
            ]
          }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Format month labels
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedMonthlyTrends = monthlyTrends.map((item) => ({
    label: `${monthNames[item._id.month - 1]} ${item._id.year}`,
    bookings: item.bookings,
    revenue: Math.round(item.revenue)
  }));

  // Status breakdown
  const statusBreakdown = [
    { status: 'Confirmed', count: confirmedBookings, color: '#10b981' },
    { status: 'Completed', count: completedBookings, color: '#3b82f6' },
    { status: 'Cancelled', count: cancelledBookings, color: '#ef4444' }
  ];

  // Top 5 performing hotels by revenue
  const topHotels = await Booking.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: '$hotel',
        totalRevenue: { $sum: '$totalPrice' },
        bookingsCount: { $sum: 1 }
      }
    },
    {
      $sort: { totalRevenue: -1 }
    },
    {
      $limit: 5
    },
    {
      $lookup: {
        from: 'hotels',
        localField: '_id',
        foreignField: '_id',
        as: 'hotelDetails'
      }
    },
    {
      $unwind: '$hotelDetails'
    },
    {
      $project: {
        _id: 1,
        name: '$hotelDetails.name',
        city: '$hotelDetails.city',
        country: '$hotelDetails.country',
        image: { $arrayElemAt: ['$hotelDetails.images', 0] },
        totalRevenue: 1,
        bookingsCount: 1
      }
    }
  ]);

  // Calculate approximate occupancy rate across active hotels
  const totalPhysicalRooms = (await Room.aggregate([
    { $group: { _id: null, total: { $sum: '$totalRooms' } } }
  ]))[0]?.total || 1;

  const activeReservationsCount = await Booking.countDocuments({
    status: 'confirmed',
    checkIn: { $lte: new Date() },
    checkOut: { $gte: new Date() }
  });

  const occupancyRate = Math.min(
    100,
    Math.round((activeReservationsCount / Math.max(1, totalPhysicalRooms)) * 100)
  );

  return {
    metrics: {
      totalUsers,
      totalHotels,
      totalRooms,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      totalReviews,
      paidBookings,
      pendingPayments,
      failedPayments,
      refundedPayments,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgBookingValue,
      occupancyRate
    },
    charts: {
      monthlyTrends: formattedMonthlyTrends,
      statusBreakdown,
      topHotels
    }
  };
};

/**
 * Generates custom reports for Daily, Weekly, Monthly, or arbitrary date ranges
 */
const generateReports = async ({ timeframe = 'monthly', startDate, endDate }) => {
  let start = new Date();
  let end = new Date();

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else if (timeframe === 'daily') {
    start.setDate(start.getDate() - 1);
  } else if (timeframe === 'weekly') {
    start.setDate(start.getDate() - 7);
  } else {
    // monthly default
    start.setDate(start.getDate() - 30);
  }

  const query = {
    createdAt: { $gte: start, $lte: end }
  };

  const [bookings, totalCount, aggregateStats] = await Promise.all([
    Booking.find(query)
      .populate('hotel', 'name city country')
      .populate('user', 'name email')
      .populate('room', 'name pricePerNight')
      .sort({ createdAt: -1 })
      .limit(100),
    Booking.countDocuments(query),
    Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$paymentStatus', 'paid'] }, { $ne: ['$status', 'cancelled'] }] },
                '$totalPrice',
                0
              ]
            }
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ])
  ]);

  const stats = aggregateStats[0] || { totalRevenue: 0, confirmed: 0, cancelled: 0 };

  return {
    timeframe,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    summary: {
      totalBookings: totalCount,
      confirmed: stats.confirmed,
      cancelled: stats.cancelled,
      revenue: Math.round(stats.totalRevenue * 100) / 100
    },
    bookings
  };
};

module.exports = {
  getDashboardStats,
  generateReports
};
