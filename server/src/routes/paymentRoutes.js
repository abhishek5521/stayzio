const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/authMiddleware');
const {
  createOrder,
  verifyPayment,
  handlePaymentFailure,
  simulatePayment,
  handleWebhook
} = require('../controllers/paymentController');

// Rate limiting for payment order creation and verification (30 requests per 15 min per IP)
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many payment requests from this IP. Please try again in 15 minutes.'
  }
});

// Protected payment endpoints
router.post('/create-order', authenticate, paymentLimiter, createOrder);
router.post('/verify', authenticate, paymentLimiter, verifyPayment);
router.post('/failure', authenticate, handlePaymentFailure);
router.post('/simulate', authenticate, simulatePayment);

// Public webhook endpoint (HMAC verified inside controller)
router.post('/webhook', handleWebhook);

module.exports = router;
