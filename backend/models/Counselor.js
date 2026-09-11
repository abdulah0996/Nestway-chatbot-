const mongoose = require('mongoose');

const counselorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    name: {
        type: String,
        required: [true, 'Counselor name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Counselor email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Counselor phone is required'],
        trim: true
    },
    specialization: [{
        type: String,
        trim: true
    }],
    visaTypes: [{
        type: String,
        enum: ['STUDY_VISA', 'SKILLED_VISA', 'BUSINESS_VISA', 'VISIT_VISA']
    }],
    countries: [{
        type: String,
        trim: true
    }],
    availability: {
        days: {
            type: [String],
            default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        },
        hours: {
            type: String,
            default: '09:00 AM - 06:00 PM'
        }
    },
    active: {
        type: Boolean,
        default: true
    },
    currentWorkload: {
        type: Number,
        default: 0
    },
    maxDailyLeads: {
        type: Number,
        default: 15
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Counselor', counselorSchema);
