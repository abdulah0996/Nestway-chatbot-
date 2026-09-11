const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        enum: ['AI', 'USER', 'COUNSELOR', 'ADMIN', 'SYSTEM', 'bot', 'agent', 'user', 'admin', 'counselor', 'system'],
        required: true
    },
    message: {
        type: String,
        default: ''
    },
    content: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: 'text'
    },
    messageType: {
        type: String,
        enum: ['text', 'quick_reply', 'card', 'voice', 'meeting_booking', 'document', 'follow_up'],
        default: 'text'
    },
    deliveryStatus: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'read'
    },
    options: [{
        label: String,
        value: String,
        action: String
    }],
    actionChips: [{
        label: String,
        action: String
    }],
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

messageSchema.pre('validate', function(next) {
    if (!this.message && this.content) {
        this.message = this.content;
    }
    if (!this.content && this.message) {
        this.content = this.message;
    }
    if (!this.message && !this.content) {
        this.message = ' ';
        this.content = ' ';
    }
    next();
});

const chatConversationSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        default: null,
        index: true
    },
    serviceType: {
        type: String,
        enum: ['STUDY_VISA', 'SKILLED_VISA', 'BUSINESS_VISA', 'VISIT_VISA', null],
        default: null
    },
    mode: {
        type: String,
        enum: ['AI', 'HUMAN', 'HYBRID'],
        default: 'HYBRID'
    },
    assignedCounselor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    automationPaused: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'WAITING_HUMAN', 'CLOSED', 'FOLLOW_UP_REQUIRED', 'NEEDS_FOLLOW_UP'],
        default: 'ACTIVE'
    },
    followUpStatus: {
        type: String,
        default: null
    },
    crmTag: {
        type: String,
        default: null
    },
    meetingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting',
        default: null
    },
    leadCaptureStage: {
        type: String,
        enum: ['NAME', 'PHONE', 'EMAIL', 'SERVICE', 'QUALIFICATION', 'COMPLETED'],
        default: 'NAME',
        index: true
    },
    currentQuestionIndex: {
        type: Number,
        default: 0
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    messages: [messageSchema],
    whatsappFlow: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    answers: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
