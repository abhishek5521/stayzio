const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user'],
      index: true
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Booking must specify a hotel'],
      index: true
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Booking must specify a room'],
      index: true
    },
    checkIn: {
      type: Date,
      required: [true, 'Please provide check-in date'],
      index: true
    },
    checkOut: {
      type: Date,
      required: [true, 'Please provide check-out date'],
      index: true
    },
    guests: {
      adults: {
        type: Number,
        required: true,
        default: 1,
        min: 1
      },
      children: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    nights: {
      type: Number,
      required: true,
      min: [1, 'Booking must be for at least one night']
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxes: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    paymentProvider: {
      type: String,
      default: 'razorpay',
      trim: true
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      index: true,
      sparse: true
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      index: true,
      sparse: true
    },
    razorpaySignature: {
      type: String,
      trim: true
    },
    paidAt: {
      type: Date
    },
    paymentFailureReason: {
      type: String,
      trim: true
    },
    guestDetails: {
      fullName: {
        type: String,
        required: [true, 'Guest full name is required'],
        trim: true
      },
      email: {
        type: String,
        required: [true, 'Guest email address is required'],
        lowercase: true,
        trim: true
      },
      phone: {
        type: String,
        trim: true,
        default: ''
      },
      specialRequests: {
        type: String,
        trim: true,
        default: ''
      }
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for availability check, payment queries and fast filtering
BookingSchema.index({ room: 1, status: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ paymentStatus: 1, createdAt: -1 });
BookingSchema.index({ user: 1, createdAt: -1 });
BookingSchema.index({ hotel: 1, createdAt: -1 });
BookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', BookingSchema);
