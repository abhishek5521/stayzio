const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { createRazorpayOrder, verifyRazorpaySignature, verifyWebhookSignature } = require('../services/razorpayService');
const { checkRoomAvailability } = require('../services/availabilityService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { calculateNights } = require('../utils/dateHelpers');
const { TAX_RATE } = require('../services/bookingEngine');

/**
 * @desc    Create Razorpay Order for a booking
 * @route   POST /api/payments/create-order
 * @access  Private
 */
const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return errorResponse(res, 'bookingId is required to initiate payment', [], 400);
    }

    // 1. Fetch booking and verify ownership
    const booking = await Booking.findById(bookingId).populate('room').populate('hotel');
    if (!booking) {
      return errorResponse(res, 'Booking not found', [], 404);
    }

    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'You are not authorized to pay for this booking', [], 403);
    }

    // 2. Prevent duplicate payments on already paid bookings
    if (booking.paymentStatus === 'paid') {
      return errorResponse(res, 'This booking has already been paid and confirmed', [], 400);
    }

    if (booking.status === 'cancelled') {
      return errorResponse(res, 'Cannot pay for a cancelled booking', [], 400);
    }

    // 3. Server-side price recalculation (Never trust client-submitted amount)
    const room = await Room.findById(booking.room._id || booking.room);
    if (!room) {
      return errorResponse(res, 'Reserved room could not be verified', [], 400);
    }

    const nights = calculateNights(booking.checkIn, booking.checkOut);
    const expectedSubtotal = Math.round(room.pricePerNight * nights * 100) / 100;
    const expectedTaxes = Math.round(expectedSubtotal * TAX_RATE * 100) / 100;
    const expectedTotal = Math.round((expectedSubtotal + expectedTaxes) * 100) / 100;

    // Synchronize server truth price if needed
    if (booking.totalPrice !== expectedTotal) {
      booking.subtotal = expectedSubtotal;
      booking.taxes = expectedTaxes;
      booking.totalPrice = expectedTotal;
    }

    // 4. Verify room inventory availability for dates
    const availability = await checkRoomAvailability(
      room._id,
      booking.checkIn,
      booking.checkOut
    );

    // If availableRooms is 0 and this booking isn't already occupying a slot, reject
    if (!availability.isAvailable && booking.status !== 'pending' && booking.status !== 'confirmed') {
      return errorResponse(res, 'This room is no longer available for the chosen dates', [], 400);
    }

    // 5. Create Razorpay order via dedicated service
    const order = await createRazorpayOrder({
      amount: booking.totalPrice,
      receipt: booking.bookingReference,
      notes: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString()
      }
    });

    // 6. Save Razorpay Order ID to booking
    booking.razorpayOrderId = order.orderId;
    booking.paymentProvider = 'razorpay';
    await booking.save();

    // 7. Return checkout data (Public keyId only, NEVER the secret)
    return successResponse(res, 'Razorpay order created successfully', {
      orderId: order.orderId,
      amount: booking.totalPrice,
      amountPaise: order.amountPaise,
      currency: order.currency,
      keyId: order.keyId,
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      isSimulated: order.isSimulated || false
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cryptographically verify Razorpay Payment Signature
 * @route   POST /api/payments/verify
 * @access  Private
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse(
        res,
        'Missing required payment verification parameters (bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature)',
        [],
        400
      );
    }

    // 1. Fetch booking and verify ownership
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return errorResponse(res, 'Booking not found', [], 404);
    }

    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'You are not authorized to verify this payment', [], 403);
    }

    // 2. Idempotency Check: prevent duplicate confirmations from corrupting state
    if (booking.paymentStatus === 'paid' && booking.razorpayPaymentId === razorpay_payment_id) {
      const populated = await Booking.findById(booking._id)
        .populate('hotel', 'name address city country images rating')
        .populate('room', 'name roomType beds amenities pricePerNight')
        .populate('user', 'name email');

      return successResponse(res, 'Payment already verified and confirmed', { booking: populated });
    }

    // 3. Verify order ID matches booking record
    if (booking.razorpayOrderId && booking.razorpayOrderId !== razorpay_order_id) {
      return errorResponse(res, 'Razorpay order ID does not match this booking record', [], 400);
    }

    // 4. Cryptographic HMAC-SHA256 signature verification
    const isValidSignature = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValidSignature) {
      booking.paymentStatus = 'failed';
      booking.paymentFailureReason = 'Cryptographic signature verification failed';
      await booking.save();

      return errorResponse(
        res,
        'Payment verification failed: Invalid cryptographic signature',
        ['The signature returned from the gateway does not match the server HMAC digest.'],
        400
      );
    }

    // 5. Signature verified! Set paymentStatus to 'paid' and booking status to 'confirmed'
    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    booking.razorpayOrderId = razorpay_order_id;
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paidAt = new Date();
    booking.paymentFailureReason = undefined;

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('hotel', 'name address city country images rating')
      .populate('room', 'name roomType beds amenities pricePerNight')
      .populate('user', 'name email');

    return successResponse(res, 'Payment verified successfully and booking confirmed', {
      booking: populatedBooking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record payment failure and transition status
 * @route   POST /api/payments/failure
 * @access  Private
 */
const handlePaymentFailure = async (req, res, next) => {
  try {
    const { bookingId, reason, razorpay_order_id, razorpay_payment_id } = req.body;

    if (!bookingId) {
      return errorResponse(res, 'bookingId is required', [], 400);
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return errorResponse(res, 'Booking not found', [], 404);
    }

    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'Unauthorized', [], 403);
    }

    // Do not overwrite an already successful payment
    if (booking.paymentStatus !== 'paid') {
      booking.paymentStatus = 'failed';
      booking.paymentFailureReason = reason || 'Payment transaction failed or cancelled by user';
      if (razorpay_order_id) booking.razorpayOrderId = razorpay_order_id;
      if (razorpay_payment_id) booking.razorpayPaymentId = razorpay_payment_id;
      await booking.save();
    }

    return successResponse(res, 'Payment failure recorded', {
      bookingId: booking._id,
      paymentStatus: booking.paymentStatus,
      reason: booking.paymentFailureReason
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Simulate payment completion for demo / sandbox environments
 * @route   POST /api/payments/simulate
 * @access  Private
 */
const simulatePayment = async (req, res, next) => {
  try {
    const { orderId, bookingId } = req.body;
    const { key_id } = require('../services/razorpayService').getRazorpayClient();
    const { generateTestSignature } = require('../services/razorpayService');

    if (!orderId || !bookingId) {
      return errorResponse(res, 'orderId and bookingId are required', [], 400);
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return errorResponse(res, 'Booking not found', [], 404);
    }

    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'Unauthorized', [], 403);
    }

    const crypto = require('crypto');
    const paymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
    const signature = generateTestSignature(orderId, paymentId);

    return successResponse(res, 'Simulated payment parameters generated', {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Handle Razorpay Webhooks
 * @route   POST /api/payments/webhook
 * @access  Public (HMAC Verified)
 */
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const payment = payload.payment?.entity;
      const orderId = payment?.order_id;

      if (orderId) {
        const booking = await Booking.findOne({ razorpayOrderId: orderId });
        if (booking && booking.paymentStatus !== 'paid') {
          booking.paymentStatus = 'paid';
          booking.status = 'confirmed';
          booking.razorpayPaymentId = payment.id;
          booking.paidAt = new Date();
          await booking.save();
        }
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payment?.entity;
      const orderId = payment?.order_id;

      if (orderId) {
        const booking = await Booking.findOne({ razorpayOrderId: orderId });
        if (booking && booking.paymentStatus !== 'paid') {
          booking.paymentStatus = 'failed';
          booking.paymentFailureReason = payment.error_description || 'Webhook reported payment failure';
          await booking.save();
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[PaymentWebhook] Error:', error);
    return res.status(500).json({ success: false, message: 'Webhook error' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handlePaymentFailure,
  simulatePayment,
  handleWebhook
};
