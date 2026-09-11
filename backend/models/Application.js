const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        default: null,
        index: true
    },
    universityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    course: {
        type: String,
        required: true
    },
    intake: {
        type: String,
        default: 'Fall 2026'
    },
    // Application Pipeline Stages
    status: {
        type: String,
        enum: [
            // Standard Application Pipeline stages
            'PROFILE_REVIEW',
            'DOCUMENT_COLLECTION',
            'UNIVERSITY_SELECTION',
            'APPLICATION_SUBMITTED',
            'OFFER_RECEIVED',
            'VISA_PROCESSING',
            'COMPLETED',
            // Backward-compatible legacy stages
            'Draft',
            'Submitted',
            'Under Review',
            'Offer Issued',
            'Deposit Paid',
            'CAS Issued',
            'Visa Lodged',
            'Visa Approved',
            'Rejected'
        ],
        default: 'PROFILE_REVIEW',
        index: true
    },
    offerLetter: {
        type: String,
        default: ''
    },
    visaStatus: {
        type: String,
        enum: ['Not Started', 'Documents Prepared', 'Appointment Booked', 'Submitted', 'Approved', 'Refused'],
        default: 'Not Started'
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Application', applicationSchema);
