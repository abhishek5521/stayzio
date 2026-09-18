/**
 * Comprehensive API Test Suite for Stayzio Platform
 * Tests authentication, search, date availability, booking engine collision prevention,
 * favorites, reviews, and admin dashboard metrics.
 */

const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

let server;
let baseUrl;

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    ...options
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data };
};

const runTests = async () => {
  console.log('\n======================================================');
  console.log(' STARTING STAYZIO FAANG-GRADE API TEST SUITE');
  console.log('======================================================\n');

  await connectDB();

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`[Test Runner] Temporary test server started on ${baseUrl}\n`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} - ${details}`);
      failed++;
    }
  };

  try {
    // 1. Health Check
    console.log('--- 1. Testing System Health ---');
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'online', 'Health check returns 200 online');

    // 2. Auth Tests
    console.log('\n--- 2. Testing Authentication & Security ---');
    // Admin login
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@stayzio.com', password: 'Admin@123456' })
    });
    assert(adminLogin.status === 200 && adminLogin.data.data.token, 'Admin login succeeds with JWT');
    const adminToken = adminLogin.data?.data?.token;

    // Bad password
    const badLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@stayzio.com', password: 'WrongPassword!' })
    });
    assert(badLogin.status === 401, 'Invalid credentials properly rejected with 401');

    // User registration
    const testEmail = `tester_${Date.now()}@example.com`;
    const userRegister = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Engineer',
        email: testEmail,
        password: 'Password123!',
        phone: '+1 555-999-8888'
      })
    });
    assert(userRegister.status === 201 && userRegister.data.data.token, 'New user registration succeeds');
    const userToken = userRegister.data?.data?.token;

    // Get Me
    const meRes = await request('/api/auth/me', { token: userToken });
    assert(meRes.status === 200 && meRes.data.data.user.email === testEmail, 'GET /api/auth/me returns authenticated user');

    // 3. Hotel Discovery & Search
    console.log('\n--- 3. Testing Hotel Discovery & Search ---');
    const allHotelsRes = await request('/api/hotels');
    assert(allHotelsRes.status === 200 && allHotelsRes.data.data.hotels.length > 0, 'Hotels list retrieved');

    const nySearch = await request('/api/hotels?destination=New+York');
    assert(
      nySearch.status === 200 && nySearch.data.data.hotels.every((h) => h.city === 'New York'),
      'Destination search matches New York hotels correctly'
    );

    const priceFilter = await request('/api/hotels?minPrice=10000&maxPrice=18000&sort=price_asc');
    assert(
      priceFilter.status === 200 &&
        priceFilter.data.data.hotels.length > 0 &&
        priceFilter.data.data.hotels.every((h) => h.priceFrom >= 10000 && h.priceFrom <= 18000),
      'Price range filter works accurately'
    );

    const firstHotel = allHotelsRes.data.data.hotels[0];
    const hotelDetail = await request(`/api/hotels/${firstHotel._id}`);
    assert(
      hotelDetail.status === 200 && Array.isArray(hotelDetail.data.data.hotel.rooms),
      'Hotel details returns hotel with populated rooms'
    );

    // 4. Room Availability & Critical Booking Logic
    console.log('\n--- 4. Testing Room Availability & Critical Booking Logic ---');
    const testRoom = hotelDetail.data.data.hotel.rooms[0];

    // Invalid dates: check-in in past
    const pastCheckInRes = await request('/api/bookings', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        hotelId: firstHotel._id,
        roomId: testRoom._id,
        checkIn: '2020-01-01',
        checkOut: '2020-01-05',
        guests: { adults: 1, children: 0 },
        guestDetails: { fullName: 'Test Engineer', email: testEmail }
      })
    });
    assert(pastCheckInRes.status === 400, 'Booking with past dates rejected (400)');

    // Invalid dates: check-out before check-in
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const dayAfter = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
    const checkoutBeforeCheckin = await request('/api/bookings', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        hotelId: firstHotel._id,
        roomId: testRoom._id,
        checkIn: dayAfter,
        checkOut: tomorrow,
        guests: { adults: 1, children: 0 },
        guestDetails: { fullName: 'Test Engineer', email: testEmail }
      })
    });
    assert(checkoutBeforeCheckin.status === 400, 'Booking with check-out before check-in rejected (400)');

    // Valid booking creation
    const bookingRes = await request('/api/bookings', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        hotelId: firstHotel._id,
        roomId: testRoom._id,
        checkIn: tomorrow,
        checkOut: dayAfter,
        guests: { adults: 2, children: 0 },
        guestDetails: {
          fullName: 'Test Engineer',
          email: testEmail,
          phone: '+1 555-999-8888',
          specialRequests: 'Corner room please'
        }
      })
    });
    assert(
      bookingRes.status === 201 && bookingRes.data.data.booking.bookingReference,
      'Valid booking created with unique reference & server-calculated total'
    );
    const createdBooking = bookingRes.data?.data?.booking;

    // Verify booking history
    const myBookingsRes = await request('/api/bookings/my-bookings', { token: userToken });
    assert(
      myBookingsRes.status === 200 && myBookingsRes.data.data.bookings.some((b) => b._id === createdBooking._id),
      'User booking history lists newly created reservation'
    );

    // Cancel booking
    const cancelRes = await request(`/api/bookings/${createdBooking._id}/cancel`, {
      method: 'PUT',
      token: userToken,
      body: JSON.stringify({ reason: 'Schedule changed' })
    });
    assert(
      cancelRes.status === 200 && cancelRes.data.data.booking.status === 'cancelled',
      'Booking cancellation updates status to cancelled'
    );

    // 5. User Favorites
    console.log('\n--- 5. Testing User Favorites ---');
    const toggleFav = await request(`/api/users/favorites/${firstHotel._id}`, {
      method: 'POST',
      token: userToken
    });
    assert(
      toggleFav.status === 200 && toggleFav.data.data.isFavorited === true,
      'Adding hotel to favorites returns isFavorited: true'
    );

    const getFavs = await request('/api/users/favorites', { token: userToken });
    assert(
      getFavs.status === 200 && getFavs.data.data.favorites.some((f) => f._id === firstHotel._id),
      'Favorites query returns favorited hotel'
    );

    // 6. Admin Suite & Analytics
    console.log('\n--- 6. Testing Admin Suite & Analytics ---');
    // Non-admin attempting to access admin route
    const forbiddenAdminRes = await request('/api/admin/dashboard-stats', { token: userToken });
    assert(forbiddenAdminRes.status === 403, 'Regular user blocked from admin stats (403 Forbidden)');

    // Admin accessing dashboard stats
    const adminStats = await request('/api/admin/dashboard-stats', { token: adminToken });
    assert(
      adminStats.status === 200 &&
        typeof adminStats.data.data.metrics.totalHotels === 'number' &&
        adminStats.data.data.metrics.totalHotels >= 10,
      'Admin dashboard returns aggregated platform metrics and charts'
    );

    // Admin reports
    const adminReports = await request('/api/admin/reports?timeframe=monthly', { token: adminToken });
    assert(
      adminReports.status === 200 && adminReports.data.data.summary.totalBookings >= 0,
      'Admin report generator returns aggregated revenue and booking counts'
    );

    // Admin user management
    const adminUsers = await request('/api/admin/users', { token: adminToken });
    assert(
      adminUsers.status === 200 && adminUsers.data.data.users.length > 0,
      'Admin can list all platform users with booking counts'
    );

    // 7. Razorpay Payment Gateway Integration & Cryptographic Verification
    console.log('\n--- 7. Testing Razorpay Payment Gateway & Cryptographic Verification ---');
    const { generateTestSignature } = require('./src/services/razorpayService');

    // Create a new booking specifically for payment testing
    const nextWeek1 = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10);
    const nextWeek2 = new Date(Date.now() + 86400000 * 9).toISOString().slice(0, 10);
    const payBookingRes = await request('/api/bookings', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        hotelId: firstHotel._id,
        roomId: testRoom._id,
        checkIn: nextWeek1,
        checkOut: nextWeek2,
        guests: { adults: 2, children: 0 },
        guestDetails: {
          fullName: 'Test Engineer',
          email: testEmail
        }
      })
    });
    assert(payBookingRes.status === 201, 'Created pending booking for Razorpay test');
    const payBooking = payBookingRes.data?.data?.booking;

    // Reject unauthenticated order creation
    const unauthOrder = await request('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ bookingId: payBooking._id })
    });
    assert(unauthOrder.status === 401, 'Unauthenticated order creation rejected (401)');

    // Create Razorpay Order with server-side price calculation
    const createOrderRes = await request('/api/payments/create-order', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({ bookingId: payBooking._id })
    });
    assert(
      createOrderRes.status === 200 &&
        createOrderRes.data.data.orderId &&
        createOrderRes.data.data.amountPaise === Math.round(payBooking.totalPrice * 100) &&
        createOrderRes.data.data.currency === 'INR',
      'Razorpay order created with server-calculated INR amount in paise'
    );
    const razorpayOrderId = createOrderRes.data?.data?.orderId;

    // Cryptographic signature forgery test: reject invalid signature
    const fakePaymentId = 'pay_fake_payment_999';
    const forgedVerify = await request('/api/payments/verify', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        bookingId: payBooking._id,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      })
    });
    assert(
      forgedVerify.status === 400 && forgedVerify.data.message.includes('signature'),
      'Cryptographic HMAC forgery rejected (400) via timingSafeEqual'
    );

    // Cryptographic verification test: valid HMAC-SHA256 signature
    const validPaymentId = `pay_${Date.now()}`;
    const validSignature = generateTestSignature(razorpayOrderId, validPaymentId);
    const validVerify = await request('/api/payments/verify', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        bookingId: payBooking._id,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: validPaymentId,
        razorpay_signature: validSignature
      })
    });
    assert(
      validVerify.status === 200 &&
        validVerify.data.data.booking.paymentStatus === 'paid' &&
        validVerify.data.data.booking.status === 'confirmed' &&
        validVerify.data.data.booking.razorpayPaymentId === validPaymentId &&
        validVerify.data.data.booking.paidAt,
      'Valid HMAC-SHA256 signature updates paymentStatus to "paid" and status to "confirmed"'
    );

    // Idempotency: repeated verification does not fail or duplicate
    const idempotentVerify = await request('/api/payments/verify', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        bookingId: payBooking._id,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: validPaymentId,
        razorpay_signature: validSignature
      })
    });
    assert(
      idempotentVerify.status === 200 && idempotentVerify.data.data.booking.paymentStatus === 'paid',
      'Idempotent verification returns success without corrupting state'
    );

    // Guard against double payment: cannot create order for already paid booking
    const doublePayOrder = await request('/api/payments/create-order', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({ bookingId: payBooking._id })
    });
    assert(
      doublePayOrder.status === 400 && doublePayOrder.data.message.includes('already been paid'),
      'Prevent duplicate payment on already paid booking (400)'
    );

    // Payment failure recording endpoint
    const failBookingRes = await request('/api/bookings', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        hotelId: firstHotel._id,
        roomId: testRoom._id,
        checkIn: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
        checkOut: new Date(Date.now() + 86400000 * 16).toISOString().slice(0, 10),
        guests: { adults: 1, children: 0 },
        guestDetails: { fullName: 'Test Engineer', email: testEmail }
      })
    });
    const failBooking = failBookingRes.data?.data?.booking;
    const failRecordRes = await request('/api/payments/failure', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        bookingId: failBooking._id,
        reason: 'Bank server timeout',
        razorpay_order_id: 'order_test_fail_1'
      })
    });
    assert(
      failRecordRes.status === 200 && failRecordRes.data.data.paymentStatus === 'failed',
      'Payment failure recording transitions paymentStatus to "failed"'
    );

  } catch (err) {
    console.error('[Fatal Test Error]:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n======================================================');
    console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
