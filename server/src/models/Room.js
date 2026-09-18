const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Room must belong to a hotel'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide room name'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    roomType: {
      type: String,
      enum: ['standard', 'deluxe', 'suite', 'executive', 'penthouse', 'family'],
      default: 'standard',
      index: true
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Please specify price per night'],
      min: [0, 'Price per night cannot be negative'],
      index: true
    },
    capacity: {
      adults: {
        type: Number,
        default: 2,
        min: 1
      },
      children: {
        type: Number,
        default: 0,
        min: 0
      },
      totalGuests: {
        type: Number,
        default: 2,
        min: 1
      }
    },
    beds: {
      count: {
        type: Number,
        default: 1,
        min: 1
      },
      type: {
        type: String,
        default: 'King Bed'
      }
    },
    amenities: {
      type: [String],
      default: []
    },
    images: {
      type: [String],
      default: []
    },
    totalRooms: {
      type: Number,
      required: [true, 'Please specify total rooms count in inventory'],
      min: [1, 'Total rooms must be at least 1'],
      default: 5
    }
  },
  {
    timestamps: true
  }
);

// Indexes
RoomSchema.index({ hotel: 1, roomType: 1 });
RoomSchema.index({ hotel: 1, pricePerNight: 1 });

module.exports = mongoose.model('Room', RoomSchema);
