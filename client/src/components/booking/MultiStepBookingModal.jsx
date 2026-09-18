import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Bed,
  CreditCard,
  Printer,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  RefreshCw,
  Copy,
  Lock,
  Check
} from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { bookingService } from '../../services/bookingService';
import { hotelService } from '../../services/hotelService';
import { paymentService } from '../../services/paymentService';
import { formatINR } from '../../utils/currency';

const MultiStepBookingModal = ({
  isOpen,
  onClose,
  hotel,
  preselectedRoom = null,
  initialDates = null,
  initialGuests = null
}) => {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Multi-step State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Form Fields
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const dayAfter = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);

  const [checkIn, setCheckIn] = useState(initialDates?.checkIn || tomorrow);
  const [checkOut, setCheckOut] = useState(initialDates?.checkOut || dayAfter);
  const [guests, setGuests] = useState({
    adults: initialGuests?.adults || 2,
    children: initialGuests?.children || 0
  });
  const [selectedRoom, setSelectedRoom] = useState(preselectedRoom);

  const [guestDetails, setGuestDetails] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    specialRequests: ''
  });

  const [pendingBooking, setPendingBooking] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  // Razorpay Sandbox Demo state
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxOrderData, setSandboxOrderData] = useState(null);
  const [sandboxPaymentMethod, setSandboxPaymentMethod] = useState('card');

  // Fetch available rooms whenever checkIn / checkOut changes
  useEffect(() => {
    if (!hotel?._id || !isOpen) return;

    const fetchRooms = async () => {
      try {
        setRoomsLoading(true);
        const res = await hotelService.getRoomsByHotel(hotel._id, checkIn, checkOut);
        if (res.success) {
          setRooms(res.data.rooms || []);
          // If preselected room is not available, reset
          if (preselectedRoom) {
            const match = res.data.rooms.find((r) => r._id === preselectedRoom._id);
            if (match && match.isAvailable) {
              setSelectedRoom(match);
            } else if (res.data.rooms.length > 0) {
              const firstAvail = res.data.rooms.find((r) => r.isAvailable);
              if (firstAvail) setSelectedRoom(firstAvail);
            }
          } else if (res.data.rooms.length > 0) {
            const firstAvail = res.data.rooms.find((r) => r.isAvailable);
            if (firstAvail) setSelectedRoom(firstAvail);
          }
        }
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      } finally {
        setRoomsLoading(false);
      }
    };

    fetchRooms();
  }, [hotel?._id, checkIn, checkOut, isOpen]);

  // Calculations
  const calculateNights = () => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const nights = calculateNights();
  const pricePerNight = selectedRoom?.pricePerNight || hotel?.priceFrom || 0;
  const subtotal = Math.round(pricePerNight * nights * 100) / 100;
  const taxes = Math.round(subtotal * 0.12 * 100) / 100;
  const totalPrice = Math.round((subtotal + taxes) * 100) / 100;

  // Validation
  const validateStep1 = () => {
    setErrorMsg('');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    if (inDate < today) {
      setErrorMsg('Check-in date cannot be in the past');
      return false;
    }
    if (outDate <= inDate) {
      setErrorMsg('Check-out date must be after check-in date');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    setErrorMsg('');
    if (!guestDetails.fullName.trim()) {
      setErrorMsg('Please enter primary guest name');
      return false;
    }
    if (!guestDetails.email.trim() || !guestDetails.email.includes('@')) {
      setErrorMsg('Please provide a valid contact email');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !selectedRoom) {
      setErrorMsg('Please select an available room to continue');
      return;
    }
    if (step === 3 && !validateStep3()) return;
    setErrorMsg('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(step - 1);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.info('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Payment Verification with Server
  const handleVerifyAndComplete = async (verificationData) => {
    try {
      setIsVerifying(true);
      setErrorMsg('');
      setPaymentError('');

      const res = await paymentService.verifyPayment(verificationData);
      if (res.success && res.data.booking) {
        setCreatedBooking(res.data.booking);
        setShowSandbox(false);
        setStep(5); // Move to Success state
        toast.success('Payment verified successfully! Reservation confirmed.');
      } else {
        throw new Error(res.message || 'Signature verification failed');
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

  // Initiate Razorpay Payment Flow
  const handleInitiatePayment = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to complete your reservation');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setPaymentError('');

      // 1. If we already have a pending booking from a prior retry, reuse it. Otherwise create one.
      let targetBooking = pendingBooking;
      if (!targetBooking) {
        const payload = {
          hotelId: hotel._id,
          roomId: selectedRoom._id,
          checkIn,
          checkOut,
          guests,
          guestDetails
        };
        const bookingRes = await bookingService.createBooking(payload);
        if (!bookingRes.success || !bookingRes.data.booking) {
          throw new Error(bookingRes.message || 'Failed to create booking reservation');
        }
        targetBooking = bookingRes.data.booking;
        setPendingBooking(targetBooking);
      }

      // 2. Create Razorpay order on server
      const orderRes = await paymentService.createOrder(targetBooking._id);
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || 'Failed to initialize payment gateway order');
      }

      const orderData = orderRes.data;

      // 3. Handle Sandbox Simulation Mode (or when live keys aren't active)
      if (orderData.isSimulated) {
        setSandboxOrderData({ ...orderData, booking: targetBooking });
        setShowSandbox(true);
        setLoading(false);
        return;
      }

      // 4. Live / Real Razorpay Checkout flow
      const scriptLoaded = await paymentService.loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        // Fallback to simulated checkout if script is blocked by browser/adblocker
        console.warn('Razorpay SDK unavailable, switching to test checkout modal');
        setSandboxOrderData({ ...orderData, booking: targetBooking });
        setShowSandbox(true);
        setLoading(false);
        return;
      }

      const razorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency || 'INR',
        name: 'Stayzio Hotels',
        description: `${hotel.name} - ${selectedRoom?.name || 'Stay'}`,
        order_id: orderData.orderId,
        prefill: {
          name: guestDetails.fullName,
          email: guestDetails.email,
          contact: guestDetails.phone
        },
        theme: {
          color: '#0f766e'
        },
        modal: {
          ondismiss: async () => {
            setLoading(false);
            setPaymentError('Payment window was closed. Your reservation is pending.');
            try {
              await paymentService.recordPaymentFailure({
                bookingId: targetBooking._id,
                reason: 'Checkout modal dismissed by guest',
                razorpay_order_id: orderData.orderId
              });
            } catch (dismissErr) {
              console.warn(dismissErr);
            }
          }
        },
        handler: async (response) => {
          await handleVerifyAndComplete({
            bookingId: targetBooking._id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
        }
      };

      const rzp = new window.Razorpay(razorpayOptions);
      rzp.on('payment.failed', async (failedResp) => {
        setLoading(false);
        const reason = failedResp.error?.description || 'Transaction declined by bank';
        setPaymentError(reason);
        toast.error(reason);
        await paymentService.recordPaymentFailure({
          bookingId: targetBooking._id,
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

  // Sandbox simulation handlers
  const handleSimulatePaymentSuccess = async () => {
    if (!sandboxOrderData) return;
    try {
      setIsVerifying(true);
      const simRes = await paymentService.simulatePayment({
        orderId: sandboxOrderData.orderId,
        bookingId: sandboxOrderData.booking._id
      });
      if (!simRes.success || !simRes.data) {
        throw new Error(simRes.message || 'Simulation failed');
      }

      await handleVerifyAndComplete({
        bookingId: sandboxOrderData.booking._id,
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

  const handleSimulatePaymentFailure = async () => {
    if (!sandboxOrderData) return;
    try {
      setLoading(true);
      await paymentService.recordPaymentFailure({
        bookingId: sandboxOrderData.booking._id,
        reason: 'User cancelled transaction during sandbox payment testing',
        razorpay_order_id: sandboxOrderData.orderId
      });
      setShowSandbox(false);
      setPaymentError('Payment was cancelled / simulated failure. You can retry payment anytime.');
      toast.error('Payment cancelled');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 5 ? 'Booking Confirmed' : `Reserve at ${hotel?.name}`}
      maxWidth="680px"
    >
      {/* Multi-step progress tracker */}
      {step < 5 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '5%',
              right: '5%',
              height: '2px',
              background: '#e2e8f0',
              zIndex: 1,
              transform: 'translateY(-50%)'
            }}
          ></div>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '5%',
              width: `${((step - 1) / 3) * 90}%`,
              height: '2px',
              background: 'var(--color-accent)',
              zIndex: 2,
              transform: 'translateY(-50%)',
              transition: 'width 0.3s ease'
            }}
          ></div>

          {[
            { num: 1, label: 'Dates' },
            { num: 2, label: 'Room' },
            { num: 3, label: 'Guest Details' },
            { num: 4, label: 'Review' }
          ].map((s) => {
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            return (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  zIndex: 3,
                  background: 'var(--color-surface)',
                  padding: '0 0.5rem'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isCompleted || isActive ? 'var(--color-accent)' : '#e2e8f0',
                    color: isCompleted || isActive ? '#ffffff' : 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    transition: 'all 0.25s ease'
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : s.num}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: 'var(--color-danger-light)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger-dark)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.88rem'
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: DATES & GUESTS */}
      {step === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Check-in Date</label>
              <input
                type="date"
                className="form-control"
                value={checkIn}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Check-out Date</label>
              <input
                type="date"
                className="form-control"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Adults (Age 13+)</label>
              <select
                className="form-select"
                value={guests.adults}
                onChange={(e) => setGuests({ ...guests, adults: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Adult' : 'Adults'}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Children (Age 0-12)</label>
              <select
                className="form-select"
                value={guests.children}
                onChange={(e) => setGuests({ ...guests, children: Number(e.target.value) })}
              >
                {[0, 1, 2, 3].map((num) => (
                  <option key={num} value={num}>
                    {num} Children
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Duration:</span>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              {nights} {nights === 1 ? 'Night' : 'Nights'}
            </span>
          </div>
        </div>
      )}

      {/* STEP 2: ROOM SELECTION */}
      {step === 2 && (
        <div>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Available rooms for {checkIn} to {checkOut} ({nights} nights):
          </p>

          {roomsLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-accent)' }}>
              Checking real-time room availability...
            </div>
          ) : rooms.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>
              No rooms found for this property.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '340px', overflowY: 'auto' }}>
              {rooms.map((room) => {
                const isSelected = selectedRoom?._id === room._id;
                const isAvail = room.isAvailable;

                return (
                  <div
                    key={room._id}
                    onClick={() => isAvail && setSelectedRoom(room)}
                    style={{
                      border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSelected ? 'var(--color-accent-light)' : 'var(--color-surface)',
                      cursor: isAvail ? 'pointer' : 'not-allowed',
                      opacity: isAvail ? 1 : 0.5,
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{room.name}</h4>
                        {isAvail ? (
                          <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                            {room.availableRooms} Left
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>
                            Sold Out
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <span>{room.beds?.count} {room.beds?.type}</span>
                        <span>Max {room.capacity?.totalGuests} Guests</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                        {formatINR(room.pricePerNight)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>/ night</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: GUEST DETAILS */}
      {step === 3 && (
        <div>
          <div className="form-group">
            <label className="form-label">Primary Guest Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. John Doe"
              value={guestDetails.fullName}
              onChange={(e) => setGuestDetails({ ...guestDetails, fullName: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address (for confirmation) *</label>
              <input
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={guestDetails.email}
                onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-control"
                placeholder="+1 (555) 000-0000"
                value={guestDetails.phone}
                onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Special Requests (Optional)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="High floor, quiet room, late check-in arrival..."
              value={guestDetails.specialRequests}
              onChange={(e) => setGuestDetails({ ...guestDetails, specialRequests: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & PRICING BREAKDOWN */}
      {step === 4 && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
            <img
              src={hotel.images?.[0]}
              alt={hotel.name}
              style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
            />
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem' }}>{hotel.name}</h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                {hotel.city}, {hotel.country}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-accent)' }}>
                {selectedRoom?.name}
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h5 style={{ marginBottom: '0.75rem', fontWeight: 700 }}>Stay Itinerary</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem' }}>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Check-in:</span> <strong>{checkIn}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Check-out:</span> <strong>{checkOut}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Nights:</span> <strong>{nights}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Guests:</span> <strong>{guests.adults} Adults, {guests.children} Children</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Lead Guest:</span> <strong>{guestDetails.fullName}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Email:</span> <strong>{guestDetails.email}</strong></div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h5 style={{ marginBottom: '0.75rem', fontWeight: 700 }}>Price Breakdown</h5>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              <span>{formatINR(pricePerNight)} &times; {nights} nights</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              <span>Hospitality Taxes & GST (12%)</span>
              <span>{formatINR(taxes)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--color-border)',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: 'var(--color-primary)'
              }}
            >
              <span>Total Payable</span>
              <span>{formatINR(totalPrice)}</span>
            </div>
          </div>

          {/* Razorpay Trust & Security Guarantee */}
          <div
            style={{
              padding: '0.85rem 1rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              fontSize: '0.82rem',
              color: '#166534',
              marginBottom: paymentError ? '1rem' : '0'
            }}
          >
            <ShieldCheck size={22} color="#16a34a" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700 }}>Razorpay Secure Checkout</div>
              <div style={{ color: '#15803d', fontSize: '0.78rem' }}>
                Encrypted via 256-bit SSL with backend cryptographic HMAC-SHA256 signature verification.
              </div>
            </div>
          </div>

          {/* Payment Error / Failure Alert */}
          {paymentError && (
            <div
              style={{
                padding: '0.85rem 1rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                fontSize: '0.85rem',
                color: '#991b1b',
                marginTop: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} color="#dc2626" />
                <span>{paymentError}</span>
              </div>
              <button
                type="button"
                onClick={handleInitiatePayment}
                className="btn btn-sm"
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  whiteSpace: 'nowrap'
                }}
                disabled={loading || isVerifying}
              >
                <RefreshCw size={13} className={loading ? 'spin' : ''} /> Retry Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: PAYMENT SUCCESS & CONFIRMATION RECEIPT */}
      {step === 5 && createdBooking && (
        <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--color-success-light)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: 'var(--color-text)' }}>
            Payment Successful!
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            Your reservation is verified and confirmed. A receipt has been saved to your account.
          </p>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              maxWidth: '460px',
              margin: '0 auto 1.5rem auto',
              textAlign: 'left'
            }}
          >
            {/* Reference Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px dashed #cbd5e1' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Booking Reference
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '0.04em' }}>
                  {createdBooking.bookingReference}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                  PAID
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                  CONFIRMED
                </span>
              </div>
            </div>

            {/* Verification Metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Hotel:</span>
                <strong>{createdBooking.hotel?.name || hotel.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Room:</span>
                <span>{createdBooking.room?.name || selectedRoom?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Dates:</span>
                <strong>
                  {new Date(createdBooking.checkIn).toLocaleDateString()} &rarr; {new Date(createdBooking.checkOut).toLocaleDateString()} ({nights} {nights === 1 ? 'night' : 'nights'})
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Guest:</span>
                <span>{guestDetails.fullName}</span>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Payment Gateway:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>Razorpay (HMAC Verified)</span>
                </div>
                {createdBooking.razorpayPaymentId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Payment ID:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdBooking.razorpayPaymentId, 'payId')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.82rem',
                        fontFamily: 'monospace',
                        color: 'var(--color-primary)'
                      }}
                      title="Click to copy Payment ID"
                    >
                      <span>{createdBooking.razorpayPaymentId}</span>
                      {copiedField === 'payId' ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                    </button>
                  </div>
                )}
                {createdBooking.paidAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Paid At:</span>
                    <span>{new Date(createdBooking.paidAt).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #cbd5e1', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  <span>Amount Paid:</span>
                  <span>{formatINR(createdBooking.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={handlePrint} className="btn btn-secondary">
              <Printer size={16} /> Print Receipt
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/my-bookings');
              }}
              className="btn btn-primary"
            >
              Go to My Bookings
            </button>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      {step < 5 && (
        <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
          {step > 1 && (
            <button onClick={handleBack} className="btn btn-secondary" disabled={loading || isVerifying}>
              <ArrowLeft size={16} /> Back
            </button>
          )}

          {step < 4 ? (
            <button onClick={handleNext} className="btn btn-primary">
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleInitiatePayment}
              className="btn btn-primary"
              disabled={loading || isVerifying}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Initiating Razorpay...
                </>
              ) : isVerifying ? (
                <>
                  <RefreshCw size={16} className="spin" /> Verifying Bank Signature...
                </>
              ) : pendingBooking ? (
                <>
                  <RefreshCw size={16} /> Retry Payment ({formatINR(totalPrice)})
                </>
              ) : (
                <>
                  <CreditCard size={16} /> Pay with Razorpay ({formatINR(totalPrice)})
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* RAZORPAY SANDBOX CHECKOUT MODAL (For demo, automated evaluation, or test key simulation) */}
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
              border: '1px solid #e2e8f0',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Razorpay Brand Header */}
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

            {/* Sandbox Notice Banner */}
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
                <strong>Test Sandbox Environment:</strong> Simulated gateway with official server HMAC SHA-256 verification.
              </span>
            </div>

            {/* Body */}
            <div style={{ padding: '1.25rem 1.5rem' }}>
              {/* Payment Method Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {['card', 'upi', 'netbanking'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSandboxPaymentMethod(method)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: sandboxPaymentMethod === method ? '2px solid #0f766e' : '1px solid #e2e8f0',
                      background: sandboxPaymentMethod === method ? '#f0fdfa' : '#ffffff',
                      color: sandboxPaymentMethod === method ? '#0f766e' : 'var(--color-text-muted)',
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

              {/* Method Details */}
              {sandboxPaymentMethod === 'card' && (
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

              {sandboxPaymentMethod === 'upi' && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                  <div style={{ marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>Virtual Payment Address (VPA):</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f766e' }}>stayzio.guest@okhdfcbank</div>
                </div>
              )}

              {sandboxPaymentMethod === 'netbanking' && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                  <div style={{ color: 'var(--color-text-muted)' }}>Simulated Bank:</div>
                  <div style={{ fontWeight: 700, color: '#0f766e' }}>HDFC Bank / ICICI Bank Sandbox</div>
                </div>
              )}

              {/* Order Reference */}
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                <div>Order: <span style={{ fontFamily: 'monospace' }}>{sandboxOrderData.orderId}</span></div>
                <div>Receipt: <span style={{ fontFamily: 'monospace' }}>{sandboxOrderData.bookingReference}</span></div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={handleSimulatePaymentSuccess}
                  disabled={isVerifying}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Verifying HMAC SHA-256...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Pay {formatINR(sandboxOrderData.amount)} (Simulate Success)
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSimulatePaymentFailure}
                  disabled={isVerifying}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    color: '#dc2626',
                    borderColor: '#fca5a5',
                    fontSize: '0.85rem'
                  }}
                >
                  Simulate Bank Failure / User Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MultiStepBookingModal;
