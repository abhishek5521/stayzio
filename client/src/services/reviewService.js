import api from './api';

export const reviewService = {
  getReviewsByHotel: async (hotelId, params = {}) => {
    const res = await api.get(`/reviews/hotel/${hotelId}`, { params });
    return res.data;
  },

  createReview: async (reviewData) => {
    const res = await api.post('/reviews', reviewData);
    return res.data;
  },

  getUserReviews: async () => {
    const res = await api.get('/reviews/my-reviews');
    return res.data;
  },

  deleteReview: async (id) => {
    const res = await api.delete(`/reviews/${id}`);
    return res.data;
  }
};
