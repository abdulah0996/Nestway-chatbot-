const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        default: null,
        index: true
    },
    documentName: {
        type: String,
        required: true,
        trim: true
    },
    documentType: {
        type: String,
        enum: [
            'Passport',
            'Degree',
            'Transcript',
            'IELTS/PTE',
            'IELTS',
            'CV',
            'Financial Documents',
            'Business Plan',
            'Employment Letter',
            'Other'
        ],
        required: true
    },
    fileURL: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        default: 0
    },
    mimeType: {
        type: String,
        default: 'application/pdf'
    },
    verificationStatus: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending',
        index: true
    },
    remarks: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
