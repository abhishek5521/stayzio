const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * Razorpay Payment Gateway Service
 * Encapsulates official Razorpay Node SDK client, order creation,
 * and cryptographic HMAC-SHA256 signature verification.
 */

let razorpayClient = null;

const getRazorpayClient = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_stayzio_demo_key';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'stayzio_razorpay_secret_key_2026';

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id,
      key_secret
    });
  }
  return { client: razorpayClient, key_id, key_secret };
};

/**
 * Create a new Razorpay order
 * @param {object} params
 * @param {number} params.amount - Total amount in INR (e.g. 18500)
 * @param {string} params.receipt - Booking reference number
 * @param {object} [params.notes] - Additional metadata
 * @returns {Promise<object>} Razorpay Order Object
 */
const createRazorpayOrder = async ({ amount, receipt, notes = {} }) => {
  const { client, key_id, key_secret } = getRazorpayClient();
  const amountInPaise = Math.round(Number(amount) * 100);

  if (amountInPaise <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  // Check if credentials are real live/test keys or simulated test sandbox keys
  const isRealRazorpayKey = key_id.startsWith('rzp_live_') || (key_id.startsWith('rzp_test_') && key_id.length > 20 && !key_id.includes('demo'));

  if (isRealRazorpayKey) {
    try {
      const order = await client.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receipt.slice(0, 40),
        notes: {
          ...notes,
          platform: 'Stayzio Luxury Hotels'
        }
      });
      return {
        orderId: order.id,
        amount: amount,
        amountPaise: amountInPaise,
        currency: order.currency || 'INR',
        keyId: key_id,
        receipt: order.receipt
      };
    } catch (err) {
      console.error('[RazorpayService] Order creation error:', err);
      throw new Error(err.error?.description || err.message || 'Failed to create Razorpay payment order');
    }
  }

  // Sandbox simulation mode (when live bank credentials aren't configured yet)
  const simulatedOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
  return {
    orderId: simulatedOrderId,
    amount: amount,
    amountPaise: amountInPaise,
    currency: 'INR',
    keyId: key_id,
    receipt,
    isSimulated: true
  };
};

/**
 * Verify Razorpay payment cryptographic signature
 * Follows Razorpay official HMAC-SHA256 verification algorithm
 * @param {object} params
 * @param {string} params.orderId - Razorpay Order ID
 * @param {string} params.paymentId - Razorpay Payment ID
 * @param {string} params.signature - Razorpay signature from client
 * @returns {boolean} True if signature is cryptographically valid
 */
const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const { key_secret } = getRazorpayClient();

  const expectedSignature = crypto
    .createHmac('sha256', key_secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Guard against length mismatch before timingSafeEqual
  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf-8'),
    Buffer.from(signature, 'utf-8')
  );
};

/**
 * Helper to generate a valid signature for simulated/test environments
 * @param {string} orderId
 * @param {string} paymentId
 * @returns {string} HMAC-SHA256 hex signature
 */
const generateTestSignature = (orderId, paymentId) => {
  const { key_secret } = getRazorpayClient();
  return crypto
    .createHmac('sha256', key_secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
};

/**
 * Verify Razorpay Webhook signature
 * @param {string|Buffer} rawBody - Raw webhook request body
 * @param {string} signature - Value from 'x-razorpay-signature' header
 * @returns {boolean}
 */
const verifyWebhookSignature = (rawBody, signature) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'stayzio_webhook_secret_2026';
  if (!rawBody || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8'))
    .digest('hex');

  if (expectedSignature.length !== signature.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf-8'),
    Buffer.from(signature, 'utf-8')
  );
};

module.exports = {
  getRazorpayClient,
  createRazorpayOrder,
  verifyRazorpaySignature,
  generateTestSignature,
  verifyWebhookSignature
};
