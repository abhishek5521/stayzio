import api from './api';

export const hotelService = {
  getHotels: async (params = {}) => {
    const res = await api.get('/hotels', { params });
    return res.data;
  },

  getHotelById: async (id) => {
    const res = await api.get(`/hotels/${id}`);
    return res.data;
  },

  getFeaturedHotels: async () => {
    const res = await api.get('/hotels/featured');
    return res.data;
  },

  getPopularDestinations: async () => {
    const res = await api.get('/hotels/destinations');
    return res.data;
  },

  getRoomsByHotel: async (hotelId, checkIn, checkOut) => {
    const params = {};
    if (checkIn) params.checkIn = checkIn;
    if (checkOut) params.checkOut = checkOut;
    const res = await api.get(`/rooms/hotel/${hotelId}`, { params });
    return res.data;
  },

  createHotel: async (hotelData) => {
    const res = await api.post('/hotels', hotelData);
    return res.data;
  },

  updateHotel: async (id, hotelData) => {
    const res = await api.put(`/hotels/${id}`, hotelData);
    return res.data;
  },

  deleteHotel: async (id) => {
    const res = await api.delete(`/hotels/${id}`);
    return res.data;
  },

  createRoom: async (roomData) => {
    const res = await api.post('/rooms', roomData);
    return res.data;
  },

  updateRoom: async (id, roomData) => {
    const res = await api.put(`/rooms/${id}`, roomData);
    return res.data;
  },

  deleteRoom: async (id) => {
    const res = await api.delete(`/rooms/${id}`);
    return res.data;
  },

  toggleFavorite: async (hotelId) => {
    const res = await api.post(`/users/favorites/${hotelId}`);
    return res.data;
  },

  getFavorites: async () => {
    const res = await api.get('/users/favorites');
    return res.data;
  }
};
