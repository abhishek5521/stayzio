import api from './api';

/**
 * Payment Service for Razorpay checkout, verification and order creation
 */

let razorpayScriptPromise = null;

export const paymentService = {
  /**
   * Dynamically loads Razorpay checkout script with caching
   * @returns {Promise<boolean>}
   */
  loadRazorpayScript: () => {
    if (window.Razorpay) {
      return Promise.resolve(true);
    }

    if (razorpayScriptPromise) {
      return razorpayScriptPromise;
    }

    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('Failed to load Razorpay checkout script');
        resolve(false);
      };
      document.body.appendChild(script);
    });

    return razorpayScriptPromise;
  },

  /**
   * Create Razorpay order for booking
   * @param {string} bookingId
   * @returns {Promise<object>}
   */
  createOrder: async (bookingId) => {
    const res = await api.post('/payments/create-order', { bookingId });
    return res.data;
  },

  /**
   * Cryptographically verify payment on server
   * @param {object} params
   * @param {string} params.bookingId
   * @param {string} params.razorpay_order_id
   * @param {string} params.razorpay_payment_id
   * @param {string} params.razorpay_signature
   * @returns {Promise<object>}
   */
  verifyPayment: async ({
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  }) => {
    const res = await api.post('/payments/verify', {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });
    return res.data;
  },

  /**
   * Record payment failure
   * @param {object} params
   * @returns {Promise<object>}
   */
  recordPaymentFailure: async ({
    bookingId,
    reason,
    razorpay_order_id,
    razorpay_payment_id
  }) => {
    const res = await api.post('/payments/failure', {
      bookingId,
      reason,
      razorpay_order_id,
      razorpay_payment_id
    });
    return res.data;
  },

  /**
   * Simulate payment signature generation for demo / sandbox environments
   * @param {object} params
   * @param {string} params.orderId
   * @param {string} params.bookingId
   * @returns {Promise<object>}
   */
  simulatePayment: async ({ orderId, bookingId }) => {
    const res = await api.post('/payments/simulate', { orderId, bookingId });
    return res.data;
  }
};

export default paymentService;
