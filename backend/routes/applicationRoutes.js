const express = require('express');
const router = express.Router();
const { createApplication, getApplications, updateApplicationStatus } = require('../controllers/applicationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/', protect, createApplication);
router.get('/', protect, getApplications);
router.patch('/:id/status', protect, restrictTo('ADMIN', 'COUNSELOR'), updateApplicationStatus);

module.exports = router;
