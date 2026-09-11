const Counselor = require('../models/Counselor');

// @desc    Get all counselors
// @route   GET /api/counselors
// @access  Public / Private
const getCounselors = async (req, res) => {
    try {
        const { active, serviceType, country } = req.query;
        const query = {};

        if (active !== undefined) query.active = active === 'true';
        if (serviceType) query.visaTypes = serviceType;
        if (country) query.countries = country;

        const counselors = await Counselor.find(query).sort({ currentWorkload: 1 });
        res.json({ success: true, count: counselors.length, data: counselors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new counselor
// @route   POST /api/counselors
// @access  Private (Admin)
const createCounselor = async (req, res) => {
    try {
        const { name, email, phone, specialization, visaTypes, countries, availability, maxDailyLeads } = req.body;
        const counselor = await Counselor.create({
            name,
            email,
            phone,
            specialization: specialization || [],
            visaTypes: visaTypes || ['STUDY_VISA', 'SKILLED_VISA'],
            countries: countries || ['UK', 'Australia', 'Canada'],
            availability: availability || {},
            maxDailyLeads: maxDailyLeads || 15
        });

        res.status(201).json({ success: true, data: counselor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get counselor by ID
// @route   GET /api/counselors/:id
// @access  Public / Private
const getCounselorById = async (req, res) => {
    try {
        const counselor = await Counselor.findById(req.params.id);
        if (!counselor) {
            return res.status(404).json({ success: false, message: 'Counselor not found' });
        }
        res.json({ success: true, data: counselor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getCounselors,
    createCounselor,
    getCounselorById
};
