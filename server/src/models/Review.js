const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must have an author'],
      index: true
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Review must belong to a hotel'],
      index: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: [1, 'Rating cannot be less than 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    comment: {
      type: String,
      required: [true, 'Please provide review comment'],
      trim: true,
      minlength: [5, 'Review must be at least 5 characters']
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate review per user for the same booking (or hotel if no booking)
ReviewSchema.index({ user: 1, hotel: 1, booking: 1 }, { unique: true });

// Static method to calculate average rating and update Hotel document
ReviewSchema.statics.calculateAverageRating = async function (hotelId) {
  const stats = await this.aggregate([
    {
      $match: { hotel: new mongoose.Types.ObjectId(hotelId) }
    },
    {
      $group: {
        _id: '$hotel',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  const Hotel = mongoose.model('Hotel');
  if (stats.length > 0) {
    await Hotel.findByIdAndUpdate(hotelId, {
      rating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].reviewCount
    });
  } else {
    await Hotel.findByIdAndUpdate(hotelId, {
      rating: 0,
      reviewCount: 0
    });
  }
};

// Post-save hook to re-calculate average rating
ReviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.hotel);
});

// Post-delete hook to re-calculate average rating
ReviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.hotel);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
