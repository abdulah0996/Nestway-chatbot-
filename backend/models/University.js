const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'University name is required'],
        trim: true
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        enum: ['UK', 'Australia', 'Italy', 'Germany', 'Hungary', 'Canada', 'USA'],
        trim: true
    },
    logo: {
        type: String,
        default: ''
    },
    courses: [{
        name: String,
        level: { type: String, enum: ["Bachelor's", "Master's", "PhD", "Diploma"], default: "Master's" },
        duration: String,
        tuitionFee: String
    }],
    fees: {
        type: String,
        default: '£12,000 - £18,000 / year'
    },
    requirements: {
        minCGPA: { type: String, default: '2.8 / 4.0' },
        minIELTS: { type: String, default: '6.5 overall' },
        acceptMOI: { type: Boolean, default: false }
    },
    intakes: [{
        type: String
    }],
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('University', universitySchema);
