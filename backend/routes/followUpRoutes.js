const express = require('express');
const router = express.Router();
const { getFollowUps, processFollowUps, cancelFollowUp } = require('../controllers/followUpController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect, restrictTo('ADMIN', 'COUNSELOR'));

router.get('/', getFollowUps);
router.post('/process-due', processFollowUps);
router.post('/:id/cancel', cancelFollowUp);

module.exports = router;
