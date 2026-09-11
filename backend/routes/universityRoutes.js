const express = require('express');
const router = express.Router();
const { getUniversities, createUniversity, updateUniversity, deleteUniversity } = require('../controllers/universityController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/', getUniversities);
router.post('/', protect, restrictTo('ADMIN'), createUniversity);
router.put('/:id', protect, restrictTo('ADMIN'), updateUniversity);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteUniversity);

module.exports = router;
