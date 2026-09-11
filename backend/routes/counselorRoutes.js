const express = require('express');
const router = express.Router();
const { getCounselors, createCounselor, getCounselorById } = require('../controllers/counselorController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/', getCounselors);
router.post('/', protect, restrictTo('ADMIN'), createCounselor);
router.get('/:id', getCounselorById);

module.exports = router;
