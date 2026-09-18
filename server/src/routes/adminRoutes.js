const express = require('express');
const router = express.Router();
const {
  getStats,
  getReports,
  getUsers,
  updateUserRole,
  getAllReviews
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(authenticate, requireRole('admin'));

router.get('/dashboard-stats', getStats);
router.get('/reports', getReports);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/reviews', getAllReviews);

module.exports = router;
