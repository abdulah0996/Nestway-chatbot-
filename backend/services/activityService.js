const Activity = require('../models/Activity');

/**
 * Activity Timeline Logging Service
 * Records chronological journey events for student/lead profiles
 */
async function logActivity({
    leadId,
    conversationId = null,
    counselorId = null,
    type,
    title,
    description = '',
    metadata = {}
}) {
    try {
        if (!leadId || !type || !title) return null;

        const activity = await Activity.create({
            leadId,
            conversationId,
            counselorId,
            type,
            title,
            description,
            metadata
        });

        return activity;
    } catch (error) {
        console.error('[ActivityService] Error logging activity:', error.message);
        return null;
    }
}

/**
 * Retrieve chronological timeline feed for a lead
 */
async function getLeadTimeline(leadId, limit = 50) {
    try {
        const activities = await Activity.find({ leadId })
            .populate('counselorId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit);

        return activities;
    } catch (error) {
        console.error('[ActivityService] Error fetching timeline:', error.message);
        return [];
    }
}

module.exports = {
    logActivity,
    getLeadTimeline
};
