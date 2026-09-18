# Stayzio — FAANG-Grade Luxury Hotel Discovery & Booking Platform

Stayzio is an enterprise-grade, full-featured hotel discovery, reservation, and management platform built with modern web technologies, strict data integrity guarantees, and a luxury SaaS design system.

---

## 🌟 Key Architecture & Highlights

- **Consumer Discovery Engine**:
  - Hero search with destination autocomplete, date range selection, and guest counters.
  - Interactive Map powered by **MapTiler** and **Leaflet** with custom INR price tag markers (`₹18,500/nt`), active state highlights, and bidirectional card-to-marker synchronization.
  - Granular multi-factor filtering: Price ranges, star ratings (4.0+, 4.5+), hotel categories (Hotel, Resort, Boutique, Apartment, Villa), and amenities.
  - Sorting: Recommended & Featured, Price Low to High, Price High to Low, Highest Rated, and Popularity.
  - Responsive layout: 3-pane split view on desktop (`Filters | Results | Sticky Map`) and dedicated floating mobile map drawer.
- **Race-Condition-Resistant Booking Engine**:
  - Genuine date-overlap availability verification preventing double bookings:
    $$\text{Existing Check-In} < \text{Requested Check-Out} \quad \text{AND} \quad \text{Existing Check-Out} > \text{Requested Check-In}$$
  - Dynamic inventory tracking across physical room stock (`availableRooms = totalRooms - activeBookings`).
  - Server-calculated pricing source of truth (subtotal, 12% hospitality tax & service fee, total price).
  - Human-readable unique booking references (`STZ-YYYYMMDD-XXXXX`).
  - Guest details and cancellation lifecycle management.
- **SaaS Administrative Operations Suite**:
  - Live aggregated KPIs: Gross Revenue, Total Reservations, Configured Rooms, Registered Guests, Occupancy Rate.
  - Visual charts: Monthly Revenue & Booking volume trends, booking status distribution breakdown.
  - Full CRUD management tables for Properties, Room Inventory, Bookings, Users, and Reviews.
  - Financial audit reports supporting Daily, Weekly, Monthly, and Custom date ranges with printable transaction ledgers.
- **Security & Engineering Excellence**:
  - Zero Tailwind / Zero Bootstrap: Built with a scalable, custom CSS Design System using modern CSS custom properties, glassmorphism, responsive CSS grid, and accessible states.
  - Salted password hashing with `bcryptjs` (10 rounds).
  - Stateless JSON Web Tokens (JWT) with Bearer token authentication and role-based access control (`user`, `admin`).
  - Strict security HTTP headers with `helmet`.
  - IP-based rate limiting on authentication and general API endpoints.
  - Request validation using `express-validator`.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 6 (optimally split chunks: `react-vendor`, `leaflet-vendor`, `icons`)
- **Routing**: React Router v6
- **HTTP Client**: Axios (with authorization interceptors and automated 401 handling)
- **Icons**: Lucide React
- **Mapping**: MapTiler Streets v2 + Leaflet (`leaflet`, `react-leaflet`)
- **Styling**: Pure Modern CSS / CSS Modules (Design Tokens, Glassmorphism, CSS Grid)

### Backend
- **Runtime**: Node.js v24
- **Web Framework**: Express.js
- **Database**: MongoDB (Local or Atlas) with Mongoose ORM
- **Security**: Helmet, CORS, Express-Rate-Limit
- **Authentication**: JWT, bcryptjs

---

## 📁 Repository Structure

```
stayzio/
├── client/                     # React 18 + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── booking/        # MultiStepBookingModal.jsx
│   │   │   ├── common/         # Navbar, Footer, StarRating, Modal, Skeleton, ProtectedRoute
│   │   │   ├── hotel/          # HotelCard, HotelFilters
│   │   │   └── map/            # MapView, MapModal
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── layouts/            # MainLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── admin/          # AdminDashboard, AdminHotels, AdminRooms, AdminBookings, AdminUsers, AdminReviews, AdminReports
│   │   │   ├── public/         # Home, HotelSearch, HotelDetail, Login, Register, About, Contact
│   │   │   └── user/           # UserDashboard, MyBookings, Favorites, Profile
│   │   ├── services/           # api, authService, hotelService, bookingService, reviewService, adminService
│   │   ├── styles/             # variables.css, base.css, layout.css, components.css, map.css, admin.css
│   │   ├── routes/             # AppRoutes.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js + Express REST API Server
│   ├── src/
│   │   ├── config/             # db.js, env.js
│   │   ├── controllers/        # authController, hotelController, roomController, bookingController, reviewController, adminController
│   │   ├── middleware/         # authMiddleware, roleMiddleware, errorMiddleware, rateLimiter, validationMiddleware
│   │   ├── models/             # User, Hotel, Room, Booking, Review
│   │   ├── routes/             # authRoutes, hotelRoutes, roomRoutes, bookingRoutes, reviewRoutes, adminRoutes, index.js
│   │   ├── seed/               # seedData.js, seeder.js
│   │   ├── services/           # availabilityService, bookingEngine, analyticsService
│   │   ├── utils/              # apiResponse, bookingReference, dateHelpers
│   │   ├── validators/         # authValidator, hotelValidator, roomValidator, bookingValidator, reviewValidator
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── .env
│   ├── test-api.js             # Automated API test suite
│   └── package.json
│
├── README.md
└── package.json                # Root package with concurrently scripts
```

---

## 🔑 Development Credentials

A realistic dataset is already pre-seeded into MongoDB with the following credentials:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@stayzio.com` | `Admin@123456` | Full Access (Operations, Catalog, Inventory, Users, Reports) |
| **Guest User 1** | `emma.watson@example.com` | `Password123!` | Standard Consumer (Bookings, Favorites, Reviews, Profile) |
| **Guest User 2** | `liam.smith@example.com` | `Password123!` | Standard Consumer |
| **Guest User 3** | `sophia.rodriguez@example.com` | `Password123!` | Standard Consumer |

*(Note: The login screen also features 1-Click "Demo Admin" and "Demo Guest" fill buttons for instant testing).*

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- **Node.js**: v18 or higher (tested on Node.js v24.20.0)
- **MongoDB**: Installed and running locally on port `27017` (or provide a remote MongoDB Atlas URI)

### 2. Quick Start

From the root directory:

```bash
# 1. Install all dependencies (root, server, client)
npm run install:all

# 2. Seed the database with 10 hotels, 40 rooms, sample bookings, and reviews
npm run seed

# 3. Launch both the backend API and frontend concurrently
npm run dev
```

The services will be accessible at:
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

---

## 🗺️ MapTiler Setup
The application uses MapTiler Streets v2 raster tiles powered by Leaflet.

To configure your MapTiler API Key:
1. Sign up for a free account at [MapTiler Cloud](https://cloud.maptiler.com/).
2. Copy your API key from your MapTiler dashboard.
3. Open `client/.env` and insert your key:
   ```env
   VITE_MAPTILER_API_KEY=your_maptiler_api_key_here
   ```
4. Save and start or reload the client.

---

---

## 💳 Razorpay Payment Gateway Integration

Stayzio features an official, production-structured **Razorpay** payment gateway integration tailored for INR currency transactions with strict cryptographic security.

### 🔒 Payment Architecture & Security Principles
- **Zero Frontend Price Trust**: The transaction amount sent to Razorpay is strictly recalculated server-side ($nights \times pricePerNight \times 1.12$) and converted to paise ($INR \times 100$). The backend never trusts client-submitted prices.
- **Cryptographic HMAC-SHA256 Verification**: Payments are verified on the Node.js backend using `crypto.timingSafeEqual` comparing `crypto.createHmac('sha256', secret).update(order_id + '|' + payment_id).digest('hex')`. No client assertion of payment is ever trusted.
- **Strict Separation of Concerns**:
  - `bookingStatus`: `pending`, `confirmed`, `cancelled`, `completed`
  - `paymentStatus`: `pending`, `paid`, `failed`, `refunded`
- **Idempotent Webhooks & Verification**: Prevents duplicate confirmations or replay attacks from corrupting inventory or revenue accounting.
- **Seamless Failure Recovery & Retry**: Failed transactions or dismissed checkouts record failure diagnostics (`paymentFailureReason`) and enable guests to retry payment with 1-click without re-entering reservation parameters.
- **Sandbox Simulation & Official SDK**: Transparently supports real Razorpay API keys (`rzp_test_...` / `rzp_live_...`) as well as an interactive Sandbox Simulation checkout modal for seamless offline evaluations, demos, and CI/CD environments.

### 🔄 End-to-End Payment Flow
```
User Selects Room & Dates &rarr; Reviews Itinerary & Breakdown (₹ INR)
  &darr;
Clicks "Pay with Razorpay"
  &darr;
Backend POST /api/payments/create-order
  (Verifies inventory, recalculates price, generates Razorpay order, stores razorpayOrderId)
  &darr;
Razorpay Checkout (Official Modal or Sandbox Simulator)
  &darr;
Payment Completed &rarr; returns razorpay_order_id, razorpay_payment_id, razorpay_signature
  &darr;
Backend POST /api/payments/verify
  (HMAC-SHA256 verification using crypto.timingSafeEqual)
  &darr;
Payment Status: 'paid' & Booking Status: 'confirmed'
  &darr;
Receipt Screen with Payment ID, Reference, Print Receipt & User Dashboard sync
```

### ⚙️ Razorpay Configuration (`server/.env`)
```env
# Razorpay Payment Gateway (Test Mode)
RAZORPAY_KEY_ID=rzp_test_TYLxfG5pvrq07L
RAZORPAY_KEY_SECRET=bX0dnvDCJkwPZddyRuWf42hS
RAZORPAY_WEBHOOK_SECRET=stayzio_webhook_secret_2026
```

---

## 🧪 Testing & Verification

Run the automated API test suite covering authentication, hotel filtering, room availability checks, collision prevention, admin reporting, and **Razorpay payment verification**:

```bash
# 1. Run the comprehensive 28-test API suite
npm run test:api

# 2. Run the 39-check End-to-End Production Audit Runner
node server/audit-runner.js
```

### Test Suite Results:
- **Health Check**: `GET /api/health` (200 OK)
- **Authentication**: JWT Login, registration, password verification, 401 on bad credentials
- **Discovery**: Search by destination (New York, Paris, Tokyo), price range filter, sorting
- **Booking Engine**:
  - Past check-in dates rejected (400)
  - Check-out before check-in rejected (400)
  - Valid booking created with unique reference
  - Booking cancellation updates inventory status
- **Razorpay Payments**:
  - Unauthenticated order creation blocked (401)
  - Server-calculated price verification in paise
  - Cryptographic HMAC-SHA256 signature verification via `timingSafeEqual`
  - Forged/tampered signature rejected (400)
  - Idempotent duplicate verification handling
  - Double payment on already confirmed booking rejected (400)
  - Payment failure recording transitions status to `failed`
- **User Favorites**: Toggle and persistence
- **Administrative Suite**: 403 on non-admin user, aggregated revenue metrics reflecting paid volume, reports generator

### Frontend Production Build:
```bash
npm run build
```
Builds client production bundles with manual code splitting in under 10 seconds.

---

## 📝 License
Proprietary & Confidential. Developed for Stayzio Inc.
