import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';

// Public Pages
import Home from '../pages/public/Home';
import HotelSearch from '../pages/public/HotelSearch';
import HotelDetail from '../pages/public/HotelDetail';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import ForgotPassword from '../pages/public/ForgotPassword';
import About from '../pages/public/About';
import Contact from '../pages/public/Contact';

// User Protected Pages
import UserDashboard from '../pages/user/UserDashboard';
import MyBookings from '../pages/user/MyBookings';
import BookingDetail from '../pages/user/BookingDetail';
import Favorites from '../pages/user/Favorites';
import Profile from '../pages/user/Profile';
import UserReviews from '../pages/user/UserReviews';

// Admin Protected Pages
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminHotels from '../pages/admin/AdminHotels';
import AdminRooms from '../pages/admin/AdminRooms';
import AdminBookings from '../pages/admin/AdminBookings';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminReviews from '../pages/admin/AdminReviews';
import AdminReports from '../pages/admin/AdminReports';

// Guards
import { ProtectedRoute, AdminRoute } from '../components/common/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public & Consumer Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/hotels" element={<HotelSearch />} />
        <Route path="/hotels/:id" element={<HotelDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* User Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:id"
          element={
            <ProtectedRoute>
              <BookingDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <UserReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Dedicated Admin Login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Protected SaaS Console Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="hotels" element={<AdminHotels />} />
        <Route path="hotels/new" element={<AdminHotels />} />
        <Route path="hotels/:id/edit" element={<AdminHotels />} />
        <Route path="rooms" element={<AdminRooms />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* 404 Catch-all */}
      <Route
        path="*"
        element={
          <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              The page you are looking for does not exist or has been relocated.
            </p>
            <a href="/" className="btn btn-primary">
              Return Home
            </a>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
