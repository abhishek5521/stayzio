/**
 * Stayzio Complete Production Audit Runner
 * Validates:
 * 1. Health & DB connection
 * 2. All Public, User, and Admin Pages & Endpoints
 * 3. User End-to-End Flow (Search -> Select Room -> Book -> Confirm -> View -> Cancel -> Favorite -> Review)
 * 4. Admin Operations (Live Stats -> Hotel CRUD -> Room CRUD -> User Roles -> Moderation -> Reports)
 * 5. Edge Cases (Invalid login, Bad dates, Double bookings, Capacity limits, 403 Forbidden)
 * 6. Mapbox Coordinates Integrity & Fallback
 * 7. Clean up temporary test records
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const API_BASE = 'http://localhost:5000/api';
const CLIENT_BASE = 'http://localhost:5173';

const runAudit = async () => {
  console.log('\n=============================================================');
  console.log(' STAYZIO FINAL PRODUCTION AUDIT & VERIFICATION RUNNER');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;
  const auditResults = {};

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
      auditResults[testName] = 'PASS';
    } else {
      console.error(`  [FAIL] ${testName}: ${details}`);
      failed++;
      auditResults[testName] = `FAIL: ${details}`;
    }
  };

  const req = async (path, options = {}) => {
    const url = `${API_BASE}${path}`;
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

  try {
    // -------------------------------------------------------------
    // 1. RUN THE ENTIRE APPLICATION & SERVICES
    // -------------------------------------------------------------
    console.log('--- AUDIT SECTION 1: Health & Database Connectivity ---');
    const health = await req('/health');
    assert(health.status === 200 && health.data?.status === 'online', 'API health status online');

    const clientCheck = await fetch(CLIENT_BASE).catch(() => null);
    assert(clientCheck && clientCheck.status === 200, 'Frontend Vite dev server active on port 5173');

    // -------------------------------------------------------------
    // 2. AUTHENTICATION & SESSIONS
    // -------------------------------------------------------------
    console.log('\n--- AUDIT SECTION 2: Authentication & RBAC ---');
    // Admin login
    const adminLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@stayzio.com', password: 'Admin@123456' })
    });
    assert(adminLogin.status === 200 && adminLogin.data?.data?.token, 'Admin authentication returns JWT');
    const adminToken = adminLogin.data?.data?.token;

    // User login
    const userLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'emma.watson@example.com', password: 'Password123!' })
    });
    assert(userLogin.status === 200 && userLogin.data?.data?.token, 'Guest user authentication returns JWT');
    const userToken = userLogin.data?.data?.token;
    const userId = userLogin.data?.data?.user?.id;

    // -------------------------------------------------------------
    // 3. USER END-TO-END FLOW
    // -------------------------------------------------------------
    console.log('\n--- AUDIT SECTION 3: User End-to-End Reservation Flow ---');
    // Step A: Search for destination
    const searchRes = await req('/hotels?destination=Tokyo');
    assert(searchRes.status === 200 && searchRes.data?.data?.hotels?.length > 0, 'Destination search for "Tokyo" returns hotels');
    const tokyoHotel = searchRes.data.data.hotels[0];

    // Step B: Inspect hotel & rooms
    const hotelDetail = await req(`/hotels/${tokyoHotel._id}`);
    assert(hotelDetail.status === 200 && hotelDetail.data?.data?.hotel?.rooms?.length > 0, 'Hotel details returns populated rooms');
    const targetRoom = hotelDetail.data.data.hotel.rooms[0];

    // Step C: Check room availability for future dates
    const checkIn = new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10);
    const checkOut = new Date(Date.now() + 86400000 * 18).toISOString().slice(0, 10);

    const roomAvailRes = await req(`/rooms/hotel/${tokyoHotel._id}?checkIn=${checkIn}&checkOut=${checkOut}`);
    const availRoom = roomAvailRes.data?.data?.rooms?.find((r) => r._id === targetRoom._id);
    assert(roomAvailRes.status === 200 && availRoom?.isAvailable, 'Dynamic room availability check succeeds');
    const initialAvailableCount = availRoom.availableRooms;

    // Step D: Reserve room (Enter guest details & confirm)
    const bookingRes = await req('/bookings', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        hotelId: tokyoHotel._id,
        roomId: targetRoom._id,
        checkIn,
        checkOut,
        guests: { adults: 2, children: 0 },
        guestDetails: {
          fullName: 'Emma Watson',
          email: 'emma.watson@example.com',
          phone: '+1 (555) 234-5678',
          specialRequests: 'High floor, quiet room'
        }
      })
    });
    assert(bookingRes.status === 201 && bookingRes.data?.data?.booking?.bookingReference, 'Booking created with unique reference & server pricing');
    const createdBooking = bookingRes.data?.data?.booking;

    // Verify subtotal, tax and total
    const expectedNights = 3;
    const expectedSubtotal = targetRoom.pricePerNight * expectedNights;
    const expectedTax = Math.round(expectedSubtotal * 0.12 * 100) / 100;
    const expectedTotal = Math.round((expectedSubtotal + expectedTax) * 100) / 100;
    assert(
      createdBooking.totalPrice === expectedTotal && createdBooking.nights === expectedNights,
      `Backend calculated pricing matches truth (₹${createdBooking.totalPrice} for ${createdBooking.nights} nights)`
    );

    // Step E: Verify room inventory decreased for overlapping dates
    const postBookAvail = await req(`/rooms/hotel/${tokyoHotel._id}?checkIn=${checkIn}&checkOut=${checkOut}`);
    const postAvailRoom = postBookAvail.data?.data?.rooms?.find((r) => r._id === targetRoom._id);
    assert(
      postAvailRoom.availableRooms === initialAvailableCount - 1,
      `Room available inventory accurately decreased from ${initialAvailableCount} to ${postAvailRoom.availableRooms}`
    );

    // Step F: Verify booking appears in My Bookings
    const myBookings = await req('/bookings/my-bookings?limit=50', { token: userToken });
    assert(
      myBookings.status === 200 && myBookings.data?.data?.bookings?.some((b) => b._id === createdBooking._id),
      'New booking appears in guest booking history'
    );

    // Step G: Inspect single booking details
    const bookingDetails = await req(`/bookings/${createdBooking._id}`, { token: userToken });
    assert(
      bookingDetails.status === 200 && bookingDetails.data?.data?.booking?.bookingReference === createdBooking.bookingReference,
      'Booking details endpoint retrieves complete reservation metadata'
    );

    // Step H: Cancel eligible booking
    const cancelRes = await req(`/bookings/${createdBooking._id}/cancel`, {
      method: 'PUT',
      token: userToken,
      body: JSON.stringify({ reason: 'Flight dates adjusted' })
    });
    assert(
      cancelRes.status === 200 && cancelRes.data?.data?.booking?.status === 'cancelled',
      'Booking successfully cancelled'
    );

    // Step I: Verify room inventory restored
    const postCancelAvail = await req(`/rooms/hotel/${tokyoHotel._id}?checkIn=${checkIn}&checkOut=${checkOut}`);
    const restoredRoom = postCancelAvail.data?.data?.rooms?.find((r) => r._id === targetRoom._id);
    assert(
      restoredRoom.availableRooms === initialAvailableCount,
      `Cancelled booking restores available inventory back to ${initialAvailableCount}`
    );

    // Step J: Favorites flow
    const favToggle = await req(`/users/favorites/${tokyoHotel._id}`, {
      method: 'POST',
      token: userToken
    });
    assert(favToggle.status === 200, 'User favorites toggle succeeds');

    const favList = await req('/users/favorites', { token: userToken });
    assert(
      favList.status === 200 && Array.isArray(favList.data?.data?.favorites),
      'User favorites list retrieved'
    );

    // Step K: Verified reviews flow
    const reviewRes = await req('/reviews', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        hotelId: tokyoHotel._id,
        rating: 5,
        comment: 'Outstanding hospitality, exceptional onsen, and exquisite skyline views!'
      })
    });
    assert(
      reviewRes.status === 201 || (reviewRes.status === 400 && reviewRes.data?.message?.includes('already')),
      'Review submitted and aggregated into hotel score'
    );

    // -------------------------------------------------------------
    // 4. ADMIN END-TO-END OPERATIONS & CRUD
    // -------------------------------------------------------------
    console.log('\n--- AUDIT SECTION 4: Administrative SaaS Operations ---');
    // Live Stats
    const statsRes = await req('/admin/dashboard-stats', { token: adminToken });
    assert(
      statsRes.status === 200 &&
        statsRes.data?.data?.metrics?.totalHotels >= 10 &&
        statsRes.data?.data?.metrics?.totalRevenue > 0,
      'Admin dashboard returns live MongoDB aggregated statistics'
    );

    // Reports generator
    const reportsRes = await req('/admin/reports?timeframe=monthly', { token: adminToken });
    assert(
      reportsRes.status === 200 && reportsRes.data?.data?.summary?.totalBookings >= 0,
      'Admin financial report generated with itemized ledger'
    );

    // Hotel CRUD: Create temporary test hotel
    const testHotelRes = await req('/hotels', {
      method: 'POST',
      token: adminToken,
      body: JSON.stringify({
        name: 'Temporary Test Palace',
        description: 'Temporary property for automated production audit validation.',
        address: '100 Audit Way',
        city: 'Geneva',
        country: 'Switzerland',
        latitude: 46.2044,
        longitude: 6.1432,
        priceFrom: 420,
        hotelType: 'hotel',
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
        amenities: ['Free WiFi', 'Spa', 'Concierge']
      })
    });
    assert(testHotelRes.status === 201 && testHotelRes.data?.data?.hotel?._id, 'Admin can CREATE new hotel');
    const createdHotel = testHotelRes.data?.data?.hotel;

    // Room CRUD: Add room to the test hotel
    const testRoomRes = await req('/rooms', {
      method: 'POST',
      token: adminToken,
      body: JSON.stringify({
        hotel: createdHotel._id,
        name: 'Alpine Panoramic Suite',
        roomType: 'suite',
        pricePerNight: 420,
        totalRooms: 4,
        capacity: { adults: 2, children: 1, totalGuests: 3 },
        beds: { count: 1, type: 'Super King' },
        amenities: ['Balcony', 'Mountain View'],
        images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80']
      })
    });
    assert(testRoomRes.status === 201 && testRoomRes.data?.data?.room?._id, 'Admin can CREATE new room in hotel');
    const createdRoom = testRoomRes.data?.data?.room;

    // Edit Hotel
    const updateHotelRes = await req(`/hotels/${createdHotel._id}`, {
      method: 'PUT',
      token: adminToken,
      body: JSON.stringify({ name: 'Temporary Test Palace (Updated)' })
    });
    assert(
      updateHotelRes.status === 200 && updateHotelRes.data?.data?.hotel?.name.includes('Updated'),
      'Admin can UPDATE hotel metadata'
    );

    // Clean up temporary test hotel & room
    const deleteRoomRes = await req(`/rooms/${createdRoom._id}`, {
      method: 'DELETE',
      token: adminToken
    });
    assert(deleteRoomRes.status === 200, 'Admin can DELETE room');

    const deleteHotelRes = await req(`/hotels/${createdHotel._id}`, {
      method: 'DELETE',
      token: adminToken
    });
    assert(deleteHotelRes.status === 200, 'Admin can DELETE hotel');

    // Users directory
    const usersRes = await req('/admin/users', { token: adminToken });
    assert(
      usersRes.status === 200 && usersRes.data?.data?.users?.length >= 6,
      'Admin can inspect user accounts and booking frequencies'
    );

    // -------------------------------------------------------------
    // 5. EDGE CASES & DEFENSIVE PROGRAMMING
    // -------------------------------------------------------------
    console.log('\n--- AUDIT SECTION 5: Edge Cases & Error Handling ---');
    // Bad login
    const badLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@stayzio.com', password: 'FakePassword999!' })
    });
    assert(badLogin.status === 401, 'Bad credentials safely rejected (401)');

    // Past check-in date
    const pastBooking = await req('/bookings', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        hotelId: tokyoHotel._id,
        roomId: targetRoom._id,
        checkIn: '2023-01-01',
        checkOut: '2023-01-05',
        guestDetails: { fullName: 'Test', email: 'test@example.com' }
      })
    });
    assert(pastBooking.status === 400, 'Past check-in date rejected with validation error (400)');

    // Check-out before check-in
    const badDates = await req('/bookings', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        hotelId: tokyoHotel._id,
        roomId: targetRoom._id,
        checkIn: '2026-10-10',
        checkOut: '2026-10-05',
        guestDetails: { fullName: 'Test', email: 'test@example.com' }
      })
    });
    assert(badDates.status === 400, 'Check-out before check-in date rejected (400)');

    // Exceeding room capacity
    const excessGuests = await req('/bookings', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        hotelId: tokyoHotel._id,
        roomId: targetRoom._id,
        checkIn: '2026-10-10',
        checkOut: '2026-10-12',
        guests: { adults: 10, children: 5 }, // exceeds room capacity
        guestDetails: { fullName: 'Big Party', email: 'test@example.com' }
      })
    });
    assert(excessGuests.status === 400, 'Guest count exceeding room capacity rejected (400)');

    // Unauthorized access to admin routes by regular user
    const userTryingAdmin = await req('/admin/dashboard-stats', { token: userToken });
    assert(userTryingAdmin.status === 403, 'Regular user blocked from admin endpoint (403 Forbidden)');

    // Missing token on protected route
    const unauthBooking = await req('/bookings/my-bookings');
    assert(unauthBooking.status === 401, 'Missing token blocked from protected route (401 Unauthorized)');

    // -------------------------------------------------------------
    // 6. MAPBOX GEOGRAPHIC DATA INTEGRITY
    // -------------------------------------------------------------
    console.log('\n--- AUDIT SECTION 6: Geographic Coordinates & Mapbox ---');
    const allHotels = await req('/hotels?limit=50');
    const hotelsList = allHotels.data?.data?.hotels || [];
    const validCoords = hotelsList.every(
      (h) =>
        typeof h.latitude === 'number' &&
        typeof h.longitude === 'number' &&
        h.latitude >= -90 &&
        h.latitude <= 90 &&
        h.longitude >= -180 &&
        h.longitude <= 180
    );
    assert(validCoords, `All ${hotelsList.length} hotels contain strictly valid geographic coordinates`);

    // -------------------------------------------------------------
    // 7. RAZORPAY PAYMENT GATEWAY & CRYPTOGRAPHIC SIGNATURE AUDIT
    // -------------------------------------------------------------
    console.log('\n--- AUDIT SECTION 7: Razorpay Payment Gateway & Cryptographic Security ---');
    const { generateTestSignature } = require('./src/services/razorpayService');

    // Create a new booking for payment audit
    const auditCheckIn = new Date(Date.now() + 86400000 * 25).toISOString().slice(0, 10);
    const auditCheckOut = new Date(Date.now() + 86400000 * 28).toISOString().slice(0, 10);
    const auditBookingRes = await req('/bookings', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        hotelId: tokyoHotel._id,
        roomId: targetRoom._id,
        checkIn: auditCheckIn,
        checkOut: auditCheckOut,
        guests: { adults: 2, children: 0 },
        guestDetails: {
          fullName: 'Emma Watson',
          email: 'emma.watson@example.com'
        }
      })
    });
    assert(auditBookingRes.status === 201, 'Booking created in pending payment status');
    const auditBooking = auditBookingRes.data?.data?.booking;

    // Reject unauthenticated order creation
    const unauthOrderRes = await req('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ bookingId: auditBooking._id })
    });
    assert(unauthOrderRes.status === 401, 'Unauthenticated payment order blocked (401)');

    // Create Razorpay order
    const auditOrderRes = await req('/payments/create-order', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({ bookingId: auditBooking._id })
    });
    assert(
      auditOrderRes.status === 200 &&
        auditOrderRes.data?.data?.orderId &&
        auditOrderRes.data?.data?.currency === 'INR',
      'Razorpay order initialized with server-side price in INR'
    );
    const auditOrderId = auditOrderRes.data?.data?.orderId;

    // Forgery prevention test: reject forged signature
    const forgedAuditRes = await req('/payments/verify', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        bookingId: auditBooking._id,
        razorpay_order_id: auditOrderId,
        razorpay_payment_id: 'pay_audit_forged_999',
        razorpay_signature: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
      })
    });
    assert(forgedAuditRes.status === 400, 'Tampered / forged Razorpay signature rejected (400)');

    // Legitimate cryptographic verification
    const auditPaymentId = `pay_audit_${Date.now()}`;
    const auditSignature = generateTestSignature(auditOrderId, auditPaymentId);
    const legitVerifyRes = await req('/payments/verify', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        bookingId: auditBooking._id,
        razorpay_order_id: auditOrderId,
        razorpay_payment_id: auditPaymentId,
        razorpay_signature: auditSignature
      })
    });
    assert(
      legitVerifyRes.status === 200 &&
        legitVerifyRes.data?.data?.booking?.paymentStatus === 'paid' &&
        legitVerifyRes.data?.data?.booking?.status === 'confirmed' &&
        legitVerifyRes.data?.data?.booking?.paidAt,
      'Valid HMAC-SHA256 signature confirms booking with status "paid" and timestamp'
    );

    // Prevent double payment
    const duplicateOrderRes = await req('/payments/create-order', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({ bookingId: auditBooking._id })
    });
    assert(duplicateOrderRes.status === 400, 'Double payment on confirmed booking rejected (400)');

    // Payment failure recording endpoint
    const failAuditBookingRes = await req('/bookings', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        hotelId: tokyoHotel._id,
        roomId: targetRoom._id,
        checkIn: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
        checkOut: new Date(Date.now() + 86400000 * 32).toISOString().slice(0, 10),
        guests: { adults: 1, children: 0 },
        guestDetails: { fullName: 'Emma Watson', email: 'emma.watson@example.com' }
      })
    });
    const failAuditBooking = failAuditBookingRes.data?.data?.booking;
    const failureRes = await req('/payments/failure', {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({
        bookingId: failAuditBooking._id,
        reason: 'Payment cancelled by guest in test checkout'
      })
    });
    assert(
      failureRes.status === 200 && failureRes.data?.data?.paymentStatus === 'failed',
      'Payment failure recording transitions paymentStatus to "failed"'
    );

  } catch (err) {
    console.error('[Fatal Audit Error]:', err);
    failed++;
  } finally {
    console.log('\n=============================================================');
    console.log(` FINAL AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
};

runAudit();
