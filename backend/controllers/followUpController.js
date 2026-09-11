const FollowUp = require('../models/FollowUp');
const { processDueFollowUps } = require('../services/followUpService');

// @desc    Get all follow-ups with filter
// @route   GET /api/followups
// @access  Private
const getFollowUps = async (req, res) => {
    try {
        const { status, leadId, channel } = req.query;
        const query = {};

        if (status) query.status = status;
        if (leadId) query.leadId = leadId;
        if (channel) query.channel = channel;

        const followUps = await FollowUp.find(query)
            .populate('leadId', 'fullName phone email preferredCountry serviceType status')
            .populate('conversationId', 'sessionId')
            .sort({ scheduledAt: 1 });

        res.json({ success: true, count: followUps.length, data: followUps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Process due follow-ups with 5 pre-send cancellation rules
// @route   POST /api/followups/process-due
// @access  Private
const processFollowUps = async (req, res) => {
    try {
        const results = await processDueFollowUps();
        res.json({
            success: true,
            message: 'Due follow-ups processed successfully',
            data: results
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Cancel a specific follow-up
// @route   POST /api/followups/:id/cancel
// @access  Private
const cancelFollowUp = async (req, res) => {
    try {
        const { reason } = req.body;
        const followUp = await FollowUp.findById(req.params.id);

        if (!followUp) {
            return res.status(404).json({ success: false, message: 'Follow-up not found' });
        }

        followUp.status = 'CANCELLED';
        followUp.cancelledReason = reason || 'Manually cancelled by counselor';
        await followUp.save();

        res.json({ success: true, message: 'Follow-up cancelled', data: followUp });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getFollowUps,
    processFollowUps,
    cancelFollowUp
};
