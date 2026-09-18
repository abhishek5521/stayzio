const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { registerValidator, loginValidator, updateProfileValidator } = require('../validators/authValidator');
const validate = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfileValidator, validate, updateProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
