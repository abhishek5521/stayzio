const mongoose = require('mongoose');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const connectDB = require('../config/db');
const { generateBookingReference } = require('../utils/bookingReference');
const {
  usersData,
  hotelsData,
  generateRoomsForHotel,
  sampleReviewsData
} = require('./seedData');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seeder] Connected to MongoDB. Purging existing collections...');

    // Clean all collections
    await Promise.all([
      User.deleteMany({}),
      Hotel.deleteMany({}),
      Room.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({})
    ]);
    console.log('[Seeder] Collections purged successfully.');

    // 1. Seed Users
    console.log('[Seeder] Seeding users...');
    const createdUsers = [];
    for (const userData of usersData) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }
    const adminUser = createdUsers.find((u) => u.role === 'admin');
    const regularUsers = createdUsers.filter((u) => u.role === 'user');
    console.log(`[Seeder] Created ${createdUsers.length} users (1 admin, ${regularUsers.length} standard users).`);

    // 2. Seed Hotels
    console.log('[Seeder] Seeding hotels...');
    const createdHotels = [];
    for (const hotelData of hotelsData) {
      const hotel = await Hotel.create(hotelData);
      createdHotels.push(hotel);
    }
    console.log(`[Seeder] Created ${createdHotels.length} hotels in major world destinations.`);

    // 3. Seed Rooms for each hotel
    console.log('[Seeder] Seeding rooms for each hotel...');
    const allCreatedRooms = [];
    for (const hotel of createdHotels) {
      const roomsToCreate = generateRoomsForHotel(hotel._id, hotel.priceFrom);
      const rooms = await Room.insertMany(roomsToCreate);
      allCreatedRooms.push(...rooms);
    }
    console.log(`[Seeder] Created ${allCreatedRooms.length} rooms across all hotels.`);

    // 4. Seed Bookings
    console.log('[Seeder] Seeding realistic sample bookings...');
    const createdBookings = [];
    const now = new Date();

    // Create a variety of past, active and upcoming bookings
    for (let i = 0; i < regularUsers.length; i++) {
      const user = regularUsers[i];
      const hotel = createdHotels[i % createdHotels.length];
      const hotelRooms = allCreatedRooms.filter(
        (r) => r.hotel.toString() === hotel._id.toString()
      );
      const room = hotelRooms[0] || allCreatedRooms[0];

      // Past completed booking
      const pastCheckIn = new Date(now);
      pastCheckIn.setDate(pastCheckIn.getDate() - (20 + i * 5));
      const pastCheckOut = new Date(pastCheckIn);
      pastCheckOut.setDate(pastCheckOut.getDate() + 3);

      const pastBooking = await Booking.create({
        bookingReference: generateBookingReference(),
        user: user._id,
        hotel: hotel._id,
        room: room._id,
        checkIn: pastCheckIn,
        checkOut: pastCheckOut,
        guests: { adults: 2, children: 0 },
        nights: 3,
        pricePerNight: room.pricePerNight,
        subtotal: room.pricePerNight * 3,
        taxes: Math.round(room.pricePerNight * 3 * 0.12 * 100) / 100,
        totalPrice: Math.round(room.pricePerNight * 3 * 1.12 * 100) / 100,
        status: 'completed',
        paymentStatus: 'paid',
        paymentProvider: 'razorpay',
        razorpayOrderId: `order_seed_past_${i}`,
        razorpayPaymentId: `pay_seed_past_${i}`,
        paidAt: pastCheckIn,
        guestDetails: {
          fullName: user.name,
          email: user.email,
          phone: user.phone,
          specialRequests: 'High floor preferred'
        }
      });
      createdBookings.push(pastBooking);

      // Future confirmed booking
      const futureCheckIn = new Date(now);
      futureCheckIn.setDate(futureCheckIn.getDate() + (10 + i * 4));
      const futureCheckOut = new Date(futureCheckIn);
      futureCheckOut.setDate(futureCheckOut.getDate() + 4);

      const futureBooking = await Booking.create({
        bookingReference: generateBookingReference(),
        user: user._id,
        hotel: createdHotels[(i + 1) % createdHotels.length]._id,
        room: hotelRooms[1] ? hotelRooms[1]._id : room._id,
        checkIn: futureCheckIn,
        checkOut: futureCheckOut,
        guests: { adults: 2, children: 1 },
        nights: 4,
        pricePerNight: room.pricePerNight,
        subtotal: room.pricePerNight * 4,
        taxes: Math.round(room.pricePerNight * 4 * 0.12 * 100) / 100,
        totalPrice: Math.round(room.pricePerNight * 4 * 1.12 * 100) / 100,
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentProvider: 'razorpay',
        razorpayOrderId: `order_seed_future_${i}`,
        razorpayPaymentId: `pay_seed_future_${i}`,
        paidAt: new Date(now.getTime() - 86400000),
        guestDetails: {
          fullName: user.name,
          email: user.email,
          phone: user.phone,
          specialRequests: 'Quiet room with late arrival check-in'
        }
      });
      createdBookings.push(futureBooking);

      // One cancelled booking for variety
      if (i % 2 === 0) {
        const cancelledBooking = await Booking.create({
          bookingReference: generateBookingReference(),
          user: user._id,
          hotel: createdHotels[(i + 2) % createdHotels.length]._id,
          room: room._id,
          checkIn: new Date(now.getTime() + 86400000 * 30),
          checkOut: new Date(now.getTime() + 86400000 * 33),
          guests: { adults: 1, children: 0 },
          nights: 3,
          pricePerNight: room.pricePerNight,
          subtotal: room.pricePerNight * 3,
          taxes: Math.round(room.pricePerNight * 3 * 0.12 * 100) / 100,
          totalPrice: Math.round(room.pricePerNight * 3 * 1.12 * 100) / 100,
          status: 'cancelled',
          paymentStatus: 'refunded',
          paymentProvider: 'razorpay',
          razorpayOrderId: `order_seed_cancel_${i}`,
          razorpayPaymentId: `pay_seed_cancel_${i}`,
          paidAt: new Date(now.getTime() - 86400000 * 2),
          cancelledAt: new Date(),
          cancellationReason: 'Flight schedule changed',
          guestDetails: {
            fullName: user.name,
            email: user.email,
            phone: user.phone
          }
        });
        createdBookings.push(cancelledBooking);
      }
    }
    console.log(`[Seeder] Created ${createdBookings.length} bookings across statuses.`);

    // 5. Seed Reviews
    console.log('[Seeder] Seeding reviews...');
    let reviewIndex = 0;
    const completedBookings = createdBookings.filter((b) => b.status === 'completed');

    for (const booking of completedBookings) {
      const reviewSample = sampleReviewsData[reviewIndex % sampleReviewsData.length];
      await Review.create({
        user: booking.user,
        hotel: booking.hotel,
        booking: booking._id,
        rating: reviewSample.rating,
        comment: reviewSample.comment
      });
      reviewIndex++;
    }

    // Recalculate average ratings for all hotels
    for (const hotel of createdHotels) {
      await Review.calculateAverageRating(hotel._id);
    }
    console.log('[Seeder] Seeded reviews and aggregated hotel ratings.');

    // 6. Seed Favorites for users
    console.log('[Seeder] Populating user favorites...');
    for (let i = 0; i < regularUsers.length; i++) {
      const user = regularUsers[i];
      user.favorites = [
        createdHotels[i % createdHotels.length]._id,
        createdHotels[(i + 2) % createdHotels.length]._id
      ];
      await user.save();
    }
    console.log('[Seeder] User favorites assigned.');

    console.log('=============================================');
    console.log(' SEEDING COMPLETE');
    console.log(` Admin Email: ${adminUser.email}`);
    console.log(` Admin Pass:  Admin@123456`);
    console.log(` User Email:  ${regularUsers[0].email}`);
    console.log(` User Pass:   Password123!`);
    console.log(` Total Hotels: ${createdHotels.length}`);
    console.log(` Total Rooms:  ${allCreatedRooms.length}`);
    console.log(` Total Bookings: ${createdBookings.length}`);
    console.log('=============================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
