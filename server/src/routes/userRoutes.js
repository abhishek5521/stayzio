const express = require('express');
const router = express.Router();
const { getFavorites, toggleFavorite } = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/favorites', getFavorites);
router.post('/favorites/:hotelId', toggleFavorite);

module.exports = router;
