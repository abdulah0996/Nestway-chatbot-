const University = require('../models/University');

// @desc    Get all universities
// @route   GET /api/universities
// @access  Public / Private
const getUniversities = async (req, res) => {
    try {
        const { country, search } = req.query;
        const query = {};

        if (country) query.country = country;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { country: { $regex: search, $options: 'i' } }
            ];
        }

        const universities = await University.find(query).sort({ name: 1 });
        res.json({ success: true, count: universities.length, data: universities });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create university
// @route   POST /api/universities
// @access  Private (Admin)
const createUniversity = async (req, res) => {
    try {
        const university = await University.create(req.body);
        res.status(201).json({ success: true, data: university });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update university
// @route   PUT /api/universities/:id
// @access  Private (Admin)
const updateUniversity = async (req, res) => {
    try {
        const university = await University.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!university) {
            return res.status(404).json({ success: false, message: 'University not found' });
        }
        res.json({ success: true, data: university });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete university
// @route   DELETE /api/universities/:id
// @access  Private (Admin)
const deleteUniversity = async (req, res) => {
    try {
        await University.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'University removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getUniversities,
    createUniversity,
    updateUniversity,
    deleteUniversity
};
