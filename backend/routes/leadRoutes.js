const express = require('express');
const router = express.Router();
const {
    createLead,
    getLeads,
    getLeadById,
    updateLeadStatus,
    updateLeadStage,
    assignCounselor,
    updateLead,
    deleteLead,
    sendLeadFollowUp,
    addLeadNote,
    getLeadTimelineActivities
} = require('../controllers/leadController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/', createLead);
router.get('/', protect, getLeads);
router.get('/:id', protect, getLeadById);
router.get('/:id/timeline', protect, getLeadTimelineActivities);
router.post('/:id/follow-up', protect, sendLeadFollowUp);
router.post('/:id/notes', protect, addLeadNote);
router.patch('/:id/status', protect, updateLeadStatus);
router.patch('/:id/stage', protect, updateLeadStage);
router.patch('/:id/assign', protect, restrictTo('ADMIN', 'COUNSELOR'), assignCounselor);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteLead);

module.exports = router;
