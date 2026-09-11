const express = require('express');
const router = express.Router();
const { getFollowUps, processFollowUps, cancelFollowUp } = require('../controllers/followUpController');

router.get('/', getFollowUps);
router.post('/process-due', processFollowUps);
router.post('/:id/cancel', cancelFollowUp);

module.exports = router;
