import React, { useState } from 'react';
import {
  ShieldCheck,
  CreditCard,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  X
} from 'lucide-react';
import Modal from '../common/Modal';
import { paymentService } from '../../services/paymentService';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/currency';

/**
 * Reusable modal for completing or retrying Razorpay payment on an existing booking
 */
const PaymentCheckoutModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Sandbox simulation state
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxOrderData, setSandboxOrderData] = useState(null);
  const [sandboxMethod, setSandboxMethod] = useState('card');

  if (!booking) return null;

  const handleStartPayment = async () => {
    try {
      setLoading(true);
      setPaymentError('');

      // 1. Create Razorpay order on server
      const orderRes = await paymentService.createOrder(booking._id);
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || 'Failed to initialize payment gateway');
      }

      const orderData = orderRes.data;

      // 2. Simulated sandbox mode check
      if (orderData.isSimulated) {
        setSandboxOrderData(orderData);
        setShowSandbox(true);
        setLoading(false);
        return;
      }

      // 3. Live / Real Razorpay Checkout flow
      const scriptLoaded = await paymentService.loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        console.warn('Razorpay SDK unavailable, falling back to sandbox simulator');
        setSandboxOrderData(orderData);
        setShowSandbox(true);
        setLoading(false);
        return;
      }

      const razorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency || 'INR',
        name: 'Stayzio Hotels',
        description: `Payment for ${booking.hotel?.name || 'Hotel Reservation'}`,
        order_id: orderData.orderId,
        prefill: {
          name: booking.guestDetails?.fullName || '',
          email: booking.guestDetails?.email || '',
          contact: booking.guestDetails?.phone || ''
        },
        theme: {
          color: '#0f766e'
        },
        modal: {
          ondismiss: async () => {
            setLoading(false);
            setPaymentError('Payment window was closed. Your reservation remains pending payment.');
            try {
              await paymentService.recordPaymentFailure({
                bookingId: booking._id,
                reason: 'Checkout window dismissed by user',
                razorpay_order_id: orderData.orderId
              });
            } catch (e) {
              console.warn(e);
            }
          }
        },
        handler: async (response) => {
          await handleVerification({
            bookingId: booking._id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
        }
      };

      const rzp = new window.Razorpay(razorpayOptions);
      rzp.on('payment.failed', async (failedResp) => {
        setLoading(false);
        const reason = failedResp.error?.description || 'Payment declined by gateway';
        setPaymentError(reason);
        toast.error(reason);
        await paymentService.recordPaymentFailure({
          bookingId: booking._id,
          reason,
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: failedResp.error?.metadata?.payment_id
        });
      });
      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Payment initiation failed';
      setPaymentError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  const handleVerification = async (verificationData) => {
    try {
      setIsVerifying(true);
      const res = await paymentService.verifyPayment(verificationData);
      if (res.success && res.data.booking) {
        toast.success('Payment verified successfully! Booking confirmed.');
        setShowSandbox(false);
        if (onSuccess) onSuccess(res.data.booking);
        onClose();
      } else {
        throw new Error(res.message || 'Payment verification failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Payment verification failed';
      setPaymentError(msg);
      toast.error(msg);
    } finally {
      setIsVerifying(false);
      setLoading(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (!sandboxOrderData) return;
    try {
      setIsVerifying(true);
      const simRes = await paymentService.simulatePayment({
        orderId: sandboxOrderData.orderId,
        bookingId: booking._id
      });
      if (!simRes.success || !simRes.data) {
        throw new Error(simRes.message || 'Simulation failed');
      }

      await handleVerification({
        bookingId: booking._id,
        razorpay_order_id: simRes.data.razorpay_order_id,
        razorpay_payment_id: simRes.data.razorpay_payment_id,
        razorpay_signature: simRes.data.razorpay_signature
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Simulated payment failed';
      setPaymentError(msg);
      toast.error(msg);
      setIsVerifying(false);
    }
  };

  const handleSimulateFailure = async () => {
    if (!sandboxOrderData) return;
    try {
      setLoading(true);
      await paymentService.recordPaymentFailure({
        bookingId: booking._id,
        reason: 'User cancelled simulated checkout',
        razorpay_order_id: sandboxOrderData.orderId
      });
      setShowSandbox(false);
      setPaymentError('Simulated payment declined / cancelled. You may retry at any time.');
      toast.error('Payment cancelled');
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen && !showSandbox} onClose={onClose} title="Complete Payment" maxWidth="520px">
        <div style={{ padding: '0.5rem 0' }}>
          {/* Booking Summary Mini Card */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Reference
              </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-accent)' }}>
                {booking.bookingReference}
              </span>
            </div>
            <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem' }}>{booking.hotel?.name || 'Hotel'}</h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              {new Date(booking.checkIn).toLocaleDateString()} &rarr; {new Date(booking.checkOut).toLocaleDateString()} ({booking.nights} nights)
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0', fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)' }}>
              <span>Total Payable</span>
              <span>{formatINR(booking.totalPrice)}</span>
            </div>
          </div>

          {/* Security Badge */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.82rem',
              color: '#166534',
              marginBottom: paymentError ? '1rem' : '1.5rem'
            }}
          >
            <ShieldCheck size={20} color="#16a34a" />
            <div>
              <strong>Razorpay Secure Checkout</strong>
              <div style={{ color: '#15803d', fontSize: '0.75rem' }}>
                Encrypted via 256-bit SSL with backend HMAC-SHA256 signature verification.
              </div>
            </div>
          </div>

          {paymentError && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: '#991b1b',
                marginBottom: '1.5rem'
              }}
            >
              <AlertCircle size={18} color="#dc2626" />
              <span>{paymentError}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button onClick={onClose} className="btn btn-secondary" disabled={loading || isVerifying}>
              Cancel
            </button>
            <button
              onClick={handleStartPayment}
              className="btn btn-primary"
              disabled={loading || isVerifying}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Initializing...
                </>
              ) : isVerifying ? (
                <>
                  <RefreshCw size={16} className="spin" /> Verifying Payment...
                </>
              ) : (
                <>
                  <CreditCard size={16} /> Pay {formatINR(booking.totalPrice)}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Razorpay Sandbox Drawer / Modal */}
      {showSandbox && sandboxOrderData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0'
            }}
          >
            <div
              style={{
                background: '#0f766e',
                color: '#ffffff',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={16} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Razorpay Checkout
                  </span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.2rem' }}>
                  Stayzio Luxury Hotels
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Amount</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {formatINR(sandboxOrderData.amount)}
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#eff6ff',
                borderBottom: '1px solid #bfdbfe',
                padding: '0.65rem 1.25rem',
                fontSize: '0.78rem',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ShieldCheck size={16} color="#2563eb" />
              <span>
                <strong>Test Sandbox Environment:</strong> Real HMAC SHA-256 validation on server.
              </span>
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {['card', 'upi', 'netbanking'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSandboxMethod(method)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: sandboxMethod === method ? '2px solid #0f766e' : '1px solid #e2e8f0',
                      background: sandboxMethod === method ? '#f0fdfa' : '#ffffff',
                      color: sandboxMethod === method ? '#0f766e' : 'var(--color-text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {method === 'card' ? 'Card' : method === 'upi' ? 'UPI' : 'NetBanking'}
                  </button>
                ))}
              </div>

              {sandboxMethod === 'card' && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                  <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Test Card:</span>
                    <strong style={{ fontFamily: 'monospace' }}>4111 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 1111</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Expiry / CVV:</span>
                    <span>12/28 &bull; 123</span>
                  </div>
                </div>
              )}

              {sandboxMethod === 'upi' && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                  <div style={{ marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>UPI ID (VPA):</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f766e' }}>stayzio.guest@okhdfcbank</div>
                </div>
              )}

              {sandboxMethod === 'netbanking' && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                  <div style={{ color: 'var(--color-text-muted)' }}>Simulated Bank:</div>
                  <div style={{ fontWeight: 700, color: '#0f766e' }}>HDFC Bank Sandbox</div>
                </div>
              )}

              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                <div>Order: <span style={{ fontFamily: 'monospace' }}>{sandboxOrderData.orderId}</span></div>
                <div>Receipt: <span style={{ fontFamily: 'monospace' }}>{sandboxOrderData.bookingReference}</span></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={handleSimulateSuccess}
                  disabled={isVerifying}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Verifying Bank Signature...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Pay {formatINR(sandboxOrderData.amount)} (Simulate Success)
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSimulateFailure}
                  disabled={isVerifying}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    color: '#dc2626',
                    borderColor: '#fca5a5'
                  }}
                >
                  Simulate Bank Failure / User Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentCheckoutModal;
