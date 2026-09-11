const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true,
        index: true
    },
    counselorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    counselorName: {
        type: String,
        default: 'Ahmed Khan'
    },
    appointmentType: {
        type: String,
        enum: ['ONLINE', 'IN_PERSON'],
        default: 'ONLINE'
    },
    consultationType: {
        type: String,
        enum: ['ONLINE', 'IN_PERSON'],
        default: 'ONLINE'
    },
    serviceType: {
        type: String,
        enum: ['STUDY_VISA', 'SKILLED_VISA', 'BUSINESS_VISA', 'VISIT_VISA'],
        default: 'STUDY_VISA'
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true,
        index: true
    },
    time: {
        type: String, // e.g. "10:00 AM"
        required: true,
        index: true
    },
    durationMinutes: {
        type: Number,
        default: 45
    },
    meetingType: {
        type: String,
        default: 'Online Zoom Consultation'
    },
    meetingLink: {
        type: String,
        default: ''
    },
    branch: {
        name: { type: String, default: 'Head Office' },
        address: { type: String, default: 'Suite 402, Immigration Towers' },
        city: { type: String, default: 'London / Islamabad' }
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'COMPLETED', 'Scheduled'],
        default: 'PENDING',
        index: true
    },
    confirmedAt: {
        type: Date,
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    rescheduledAt: {
        type: Date,
        default: null
    },
    adminNotes: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    sessionId: {
        type: String,
        default: null,
        index: true
    },
    previousMeetingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting',
        default: null
    }
}, {
    timestamps: true
});

// Composite index for fast double-booking collision checks
meetingSchema.index({ counselorId: 1, date: 1, time: 1, status: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
