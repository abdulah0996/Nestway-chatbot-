const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true,
        index: true
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatConversation',
        default: null
    },
    counselorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    type: {
        type: String,
        enum: [
            'LEAD_CREATED',
            'AI_CHAT_STARTED',
            'SERVICE_SELECTED',
            'QUALIFICATION_COMPLETED',
            'SCORE_UPDATED',
            'COUNSELOR_ASSIGNED',
            'FOLLOWUP_SCHEDULED',
            'FOLLOWUP_SENT',
            'FOLLOWUP_CANCELLED',
            'MEETING_BOOKED',
            'MEETING_RESCHEDULED',
            'MEETING_CANCELLED',
            'APPOINTMENT_REQUESTED',
            'APPOINTMENT_CONFIRMED',
            'APPOINTMENT_CANCELLED',
            'APPOINTMENT_RESCHEDULED',
            'HUMAN_TAKEOVER',
            'COUNSELOR_MESSAGE',
            'NOTE_ADDED',
            'AI_RESUMED',
            'CONVERSATION_CLOSED',
            'APPLICATION_CREATED',
            'CONVERTED',
            'STATUS_CHANGED',
            'FOLLOW_UP_REQUIRED',
            'FOLLOW_UP_SENT',
            'FOLLOW_UP_REPLIED'
        ],
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Activity', activitySchema);
