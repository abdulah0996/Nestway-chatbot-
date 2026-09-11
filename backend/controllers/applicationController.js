const Application = require('../models/Application');
const Lead = require('../models/Lead');

// @desc    Create application
// @route   POST /api/applications
// @access  Private
const createApplication = async (req, res) => {
    try {
        const { studentId, leadId, universityId, course, intake } = req.body;

        const application = await Application.create({
            studentId: studentId || req.user?._id,
            leadId: leadId || null,
            universityId,
            course,
            intake: intake || 'Fall 2026',
            status: 'Submitted'
        });

        if (leadId) {
            await Lead.findByIdAndUpdate(leadId, { stage: 'University Applied' });
        }

        const populatedApp = await Application.findById(application._id)
            .populate('universityId', 'name country logo')
            .populate('studentId', 'name email');

        res.status(201).json({ success: true, data: populatedApp });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get applications
// @route   GET /api/applications
// @access  Private
const getApplications = async (req, res) => {
    try {
        const query = {};
        if (req.user && req.user.role === 'STUDENT') {
            query.studentId = req.user._id;
        }

        const applications = await Application.find(query)
            .populate('universityId', 'name country logo fees requirements')
            .populate('studentId', 'name email phone')
            .populate('leadId', 'fullName email phone countryInterest')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: applications.length, data: applications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update application status
// @route   PATCH /api/applications/:id/status
// @access  Private (Counselor / Admin)
const updateApplicationStatus = async (req, res) => {
    try {
        const { status, visaStatus, offerLetter } = req.body;
        const updateData = {};

        if (status) updateData.status = status;
        if (visaStatus) updateData.visaStatus = visaStatus;
        if (offerLetter) updateData.offerLetter = offerLetter;

        const application = await Application.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('universityId studentId leadId');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Map application status to CRM Kanban deal stage automatically
        if (application.leadId) {
            let newStage = null;
            if (status === 'Submitted') newStage = 'University Applied';
            else if (status === 'Offer Issued') newStage = 'Offer Received';
            else if (status === 'Deposit Paid') newStage = 'Deposit Paid';
            else if (visaStatus === 'Submitted') newStage = 'Visa Submitted';
            else if (visaStatus === 'Approved') newStage = 'Visa Approved';

            if (newStage) {
                await Lead.findByIdAndUpdate(application.leadId._id || application.leadId, { stage: newStage });
            }
        }

        res.json({ success: true, data: application });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createApplication,
    getApplications,
    updateApplicationStatus
};
