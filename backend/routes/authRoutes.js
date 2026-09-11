const express = require('express');
const router = express.Router();
const { register, login, getMe, getCounselors, getUsers } = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/counselors', getCounselors);
router.get('/users', protect, restrictTo('ADMIN'), getUsers);

module.exports = router;
