const Document = require('../models/Document');
const Lead = require('../models/Lead');

// @desc    Upload student document
// @route   POST /api/documents/upload
// @access  Private / Public
const uploadDocument = async (req, res) => {
    try {
        const { studentId, leadId, documentName, documentType, fileURL } = req.body;

        const doc = await Document.create({
            studentId: studentId || req.user?._id,
            leadId: leadId || null,
            documentName: documentName || req.file?.originalname || 'Student Document',
            documentType: documentType || 'Passport',
            fileURL: fileURL || (req.file ? `/uploads/${req.file.filename}` : '/uploads/sample_passport.pdf'),
            verificationStatus: 'Pending'
        });

        // Update lead stage if leadId present
        if (leadId) {
            await Lead.findByIdAndUpdate(leadId, { stage: 'Documents Pending' });
        }

        res.status(201).json({ success: true, data: doc });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get documents
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
    try {
        const query = {};
        const { studentId, leadId } = req.query;

        if (studentId) query.studentId = studentId;
        if (leadId) query.leadId = leadId;

        if (req.user && req.user.role === 'STUDENT') {
            query.studentId = req.user._id;
        }

        const documents = await Document.find(query)
            .populate('studentId', 'name email')
            .populate('leadId', 'fullName email')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: documents.length, data: documents });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update document verification status
// @route   PATCH /api/documents/:id/status
// @access  Private (Counselor / Admin)
const updateVerificationStatus = async (req, res) => {
    try {
        const { verificationStatus, remarks } = req.body;
        const document = await Document.findByIdAndUpdate(
            req.params.id,
            { verificationStatus, remarks: remarks || '' },
            { new: true }
        );
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        res.json({ success: true, data: document });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    uploadDocument,
    getDocuments,
    updateVerificationStatus
};
