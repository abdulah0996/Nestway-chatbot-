const Lead = require('../models/Lead');
const Meeting = require('../models/Meeting');
const Application = require('../models/Application');
const User = require('../models/User');

// @desc    Get SaaS dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];

        const [
            totalLeads,
            qualifiedLeads,
            meetingsToday,
            totalApplications,
            visaApproved,
            counselorsCount,
            leadsByCountry,
            leadsByStage
        ] = await Promise.all([
            Lead.countDocuments(),
            Lead.countDocuments({ status: { $in: ['QUALIFIED', 'MEETING_BOOKED', 'CONVERTED'] } }),
            Meeting.countDocuments({ date: todayStr, status: 'Scheduled' }),
            Application.countDocuments(),
            Application.countDocuments({ visaStatus: 'Approved' }),
            User.countDocuments({ role: 'COUNSELOR', active: true }),
            Lead.aggregate([
                { $group: { _id: '$countryInterest', count: { $sum: 1 } } }
            ]),
            Lead.aggregate([
                { $group: { _id: '$stage', count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalLeads,
                qualifiedLeads,
                meetingsToday,
                totalApplications,
                visaApproved,
                counselorsCount,
                leadsByCountry: leadsByCountry.reduce((acc, curr) => ({ ...acc, [curr._id || 'Other']: curr.count }), {}),
                leadsByStage: leadsByStage.reduce((acc, curr) => ({ ...acc, [curr._id || 'New Lead']: curr.count }), {})
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getStats };
