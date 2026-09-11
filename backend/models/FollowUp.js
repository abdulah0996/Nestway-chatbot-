const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
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
    message: {
        type: String,
        required: true
    },
    scheduledAt: {
        type: Date,
        required: true,
        index: true
    },
    // Backward-compatibility alias
    scheduledDate: {
        type: Date
    },
    sentAt: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['SCHEDULED', 'SENT', 'FAILED', 'CANCELLED', 'Pending', 'Completed'],
        default: 'SCHEDULED',
        index: true
    },
    attemptNumber: {
        type: Number,
        default: 1
    },
    type: {
        type: String,
        enum: ['NO_RESPONSE_24H', 'REMINDER_3D', 'NURTURE_7D', 'POST_CONSULTATION', 'MANUAL'],
        default: 'NO_RESPONSE_24H'
    },
    channel: {
        type: String,
        enum: ['WHATSAPP', 'EMAIL', 'SMS'],
        default: 'WHATSAPP'
    },
    cancelledReason: {
        type: String,
        default: ''
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Set scheduledDate from scheduledAt if missing
followUpSchema.pre('save', function (next) {
    if (this.scheduledAt && !this.scheduledDate) {
        this.scheduledDate = this.scheduledAt;
    }
    next();
});

module.exports = mongoose.model('FollowUp', followUpSchema);
