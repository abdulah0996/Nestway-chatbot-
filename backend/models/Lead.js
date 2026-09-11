const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        index: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    source: {
        type: String,
        enum: ['Website AI Chatbot', 'WhatsApp', 'Facebook Ads', 'Instagram', 'Referral', 'Direct', 'Meta Cloud API'],
        default: 'WhatsApp'
    },
    serviceType: {
        type: String,
        enum: ['STUDY_VISA', 'SKILLED_VISA', 'BUSINESS_VISA', 'VISIT_VISA'],
        default: 'STUDY_VISA',
        index: true
    },
    visaCategory: {
        type: String,
        default: 'Study Visa'
    },
    preferredCountry: {
        type: String,
        default: 'UK'
    },
    countryInterest: {
        type: String,
        default: 'UK'
    },
    // Dynamic qualification payload for any visa type
    qualificationData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Backward-compatible academic fields
    education: {
        type: String,
        default: ''
    },
    qualification: {
        type: String,
        default: ''
    },
    cgpa: {
        type: String,
        default: ''
    },
    englishTest: {
        type: String,
        default: 'None'
    },
    englishScore: {
        type: String,
        default: ''
    },
    budget: {
        type: String,
        default: ''
    },
    intake: {
        type: String,
        default: ''
    },
    leadScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
        index: true
    },
    leadTemperature: {
        type: String,
        enum: ['HOT', 'WARM', 'COLD'],
        default: 'WARM',
        index: true
    },
    scoreReasons: [{
        type: String
    }],
    eligibilityBreakdown: {
        academicScore: { type: Number, default: 0 },
        englishScore: { type: Number, default: 0 },
        budgetScore: { type: Number, default: 0 }
    },
    // Sales Pipeline Statuses
    status: {
        type: String,
        enum: [
            'NEW',
            'QUALIFYING',
            'QUALIFIED',
            'FOLLOW_UP',
            'MEETING_BOOKED',
            'CONSULTATION_COMPLETED',
            'CONSULTATION_CANCELLED',
            'APPOINTMENT_CANCELLED',
            'NEEDS_FOLLOW_UP',
            'CONVERTED',
            'LOST'
        ],
        default: 'NEW',
        index: true
    },
    // Follow-Up CRM Fields
    lastFollowUpAt: {
        type: Date,
        default: null
    },
    followUpStatus: {
        type: String,
        enum: ['NONE', 'REQUIRED', 'NEEDS_FOLLOW_UP', 'SENT', 'REPLIED', 'COMPLETED'],
        default: 'NONE',
        index: true
    },
    followUpHistory: [{
        type: {
            type: String,
            default: 'FOLLOW_UP_SENT'
        },
        action: String,
        message: String,
        sentAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            default: 'SENT'
        },
        sender: {
            type: String,
            default: 'ADMIN'
        }
    }],
    // Legacy stage field preserved for backward compatibility
    stage: {
        type: String,
        default: 'New Lead'
    },
    assignedCounselor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatConversation',
        default: null
    },
    lastInteractionAt: {
        type: Date,
        default: Date.now
    },
    nextFollowUpAt: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);
