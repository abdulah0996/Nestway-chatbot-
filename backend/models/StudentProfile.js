const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        default: null
    },
    passportStatus: {
        type: String,
        enum: ['Valid', 'Expiring Soon', 'Applied', 'Not Available'],
        default: 'Valid'
    },
    passportNumber: {
        type: String,
        default: ''
    },
    educationHistory: [{
        degree: String,
        institution: String,
        yearPassing: String,
        gradePercentage: String
    }],
    workExperience: [{
        company: String,
        role: String,
        durationMonths: Number
    }],
    studyGap: {
        type: String,
        default: '0 Years'
    },
    preferredCountries: [{
        type: String
    }],
    careerGoal: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
