import api from './api';

export const bookingService = {
  createBooking: async (bookingData) => {
    const res = await api.post('/bookings', bookingData);
    return res.data;
  },

  getMyBookings: async (params = {}) => {
    const res = await api.get('/bookings/my-bookings', { params });
    return res.data;
  },

  getBookingById: async (id) => {
    const res = await api.get(`/bookings/${id}`);
    return res.data;
  },

  cancelBooking: async (id, reason) => {
    const res = await api.put(`/bookings/${id}/cancel`, { reason });
    return res.data;
  },

  getAllBookings: async (params = {}) => {
    const res = await api.get('/bookings/admin/all', { params });
    return res.data;
  }
};
