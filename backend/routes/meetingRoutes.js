const express = require('express');
const router = express.Router();
const { 
  getAvailableSlots, 
  bookMeeting, 
  confirmMeeting,
  rescheduleMeeting,
  cancelMeeting,
  getMeetings, 
  updateMeetingStatus
} = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/slots', getAvailableSlots);
router.post('/book', bookMeeting);
router.post('/confirm', confirmMeeting);
router.post('/:id/confirm', confirmMeeting);
router.post('/reschedule', rescheduleMeeting);
router.post('/:id/reschedule', rescheduleMeeting);
router.post('/cancel', cancelMeeting);
router.post('/:id/cancel', cancelMeeting);
router.patch('/:id/cancel', cancelMeeting);
router.delete('/:id', cancelMeeting);
router.get('/', protect, getMeetings);
router.patch('/:id/status', protect, updateMeetingStatus);

module.exports = router;
