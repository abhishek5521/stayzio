const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide hotel name'],
      trim: true,
      maxlength: [120, 'Hotel name cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide hotel description']
    },
    address: {
      type: String,
      required: [true, 'Please provide hotel address'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Please provide country'],
      trim: true
    },
    latitude: {
      type: Number,
      required: [true, 'Please provide latitude']
    },
    longitude: {
      type: Number,
      required: [true, 'Please provide longitude']
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A hotel must have at least one image'
      }
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    amenities: {
      type: [String],
      default: []
    },
    hotelType: {
      type: String,
      enum: ['hotel', 'resort', 'villa', 'apartment', 'boutique', 'cabin'],
      default: 'hotel'
    },
    priceFrom: {
      type: Number,
      required: [true, 'Please specify starting price per night'],
      min: [0, 'Price cannot be negative']
    },
    featured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// GeoJSON index and performance indexes
HotelSchema.index({ location: '2dsphere' });
HotelSchema.index({ city: 1 });
HotelSchema.index({ country: 1 });
HotelSchema.index({ rating: -1 });
HotelSchema.index({ priceFrom: 1 });
HotelSchema.index({ hotelType: 1 });
HotelSchema.index({ featured: 1 });
HotelSchema.index({ name: 'text', description: 'text', city: 'text' });

// Ensure coordinates in location match latitude and longitude
HotelSchema.pre('save', function (next) {
  if (this.isModified('latitude') || this.isModified('longitude') || !this.location || !this.location.coordinates || this.location.coordinates.length === 0) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude]
    };
  }
  next();
});

// Virtual populate for rooms
HotelSchema.virtual('rooms', {
  ref: 'Room',
  localField: '_id',
  foreignField: 'hotel',
  justOne: false
});

// Virtual populate for reviews
HotelSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'hotel',
  justOne: false
});

module.exports = mongoose.model('Hotel', HotelSchema);
