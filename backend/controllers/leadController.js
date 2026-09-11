const Lead = require('../models/Lead');
const User = require('../models/User');
const ChatConversation = require('../models/ChatConversation');
const FollowUp = require('../models/FollowUp');
const { getLeadTimeline, logActivity } = require('../services/activityService');
const { assignCounselorToLead } = require('../services/counselorAssignmentService');
const { scheduleFollowUpSequence } = require('../services/followUpService');

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Public / Private
const createLead = async (req, res) => {
    try {
        const {
            fullName,
            phone,
            email,
            source,
            serviceType,
            preferredCountry,
            countryInterest,
            qualificationData,
            education,
            qualification,
            cgpa,
            englishTest,
            englishScore,
            budget,
            intake,
            leadScore,
            leadTemperature,
            scoreReasons,
            notes
        } = req.body;

        // Auto assign counselor if not specified
        let assignedCounselor = req.body.assignedCounselor;
        if (!assignedCounselor) {
            const assignment = await assignCounselorToLead({
                serviceType: serviceType || 'STUDY_VISA',
                preferredCountry: preferredCountry || countryInterest || 'UK'
            });
            if (assignment) assignedCounselor = assignment.counselorId;
        }

        const lead = await Lead.create({
            fullName,
            phone,
            email: email || '',
            source: source || 'WhatsApp',
            serviceType: serviceType || 'STUDY_VISA',
            preferredCountry: preferredCountry || countryInterest || 'UK',
            countryInterest: countryInterest || preferredCountry || 'UK',
            qualificationData: qualificationData || {},
            education: education || '',
            qualification: qualification || '',
            cgpa: cgpa || '',
            englishTest: englishTest || 'None',
            englishScore: englishScore || '',
            budget: budget || '',
            intake: intake || '',
            leadScore: leadScore || 0,
            leadTemperature: leadTemperature || 'WARM',
            scoreReasons: scoreReasons || [],
            status: leadScore >= 80 ? 'QUALIFIED' : 'NEW',
            assignedCounselor,
            notes: notes || ''
        });

        // Log creation activity
        await logActivity({
            leadId: lead._id,
            counselorId: assignedCounselor,
            type: 'LEAD_CREATED',
            title: 'Lead Created',
            description: `${fullName} registered for ${lead.serviceType} (${lead.preferredCountry})`
        });

        // Schedule follow-ups
        await scheduleFollowUpSequence(lead);

        res.status(201).json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all leads with filters & search
// @route   GET /api/leads
// @access  Private (Counselor / Admin)
const getLeads = async (req, res) => {
    try {
        const { search, status, serviceType, leadTemperature, country, counselor } = req.query;
        const query = {};

        if (status) query.status = status;
        if (serviceType) query.serviceType = serviceType;
        if (leadTemperature) query.leadTemperature = leadTemperature;
        if (country) {
            query.$or = [
                { preferredCountry: country },
                { countryInterest: country }
            ];
        }
        if (counselor) query.assignedCounselor = counselor;

        if (search) {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ]
            });
        }

        // Counselor role filter
        if (req.user && req.user.role === 'COUNSELOR' && !counselor) {
            query.$or = [
                { assignedCounselor: req.user._id },
                { assignedCounselor: null }
            ];
        }

        const leads = await Lead.find(query)
            .populate('assignedCounselor', 'name email phone')
            .populate('conversationId', 'sessionId')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: leads.length, data: leads });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single lead by ID with complete activity timeline
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id)
            .populate('assignedCounselor', 'name email phone')
            .populate('conversationId');

        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        const timeline = await getLeadTimeline(lead._id);

        res.json({
            success: true,
            data: {
                ...lead.toObject(),
                timeline
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update lead status (Sales Pipeline transition)
// @route   PATCH /api/leads/:id/status
// @access  Private
const updateLeadStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const oldLead = await Lead.findById(req.params.id);

        if (!oldLead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            { status, lastInteractionAt: new Date() },
            { new: true, runValidators: true }
        );

        // Log status change activity
        await logActivity({
            leadId: lead._id,
            counselorId: lead.assignedCounselor,
            type: 'STATUS_CHANGED',
            title: `Lead Status Updated to ${status}`,
            description: `Transitioned from ${oldLead.status} to ${status}`
        });

        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update lead details & notes
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = async (req, res) => {
    try {
        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            { ...req.body, lastInteractionAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private (Admin)
const deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findByIdAndDelete(req.params.id);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        res.json({ success: true, message: 'Lead removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update lead stage (Application Pipeline)
// @route   PATCH /api/leads/:id/stage
// @access  Private
const updateLeadStage = async (req, res) => {
    try {
        const { stage } = req.body;
        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            { stage, lastInteractionAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Assign counselor to lead
// @route   PATCH /api/leads/:id/assign
// @access  Private
const assignCounselor = async (req, res) => {
    try {
        const { counselorId } = req.body;
        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            { assignedCounselor: counselorId, lastInteractionAt: new Date() },
            { new: true, runValidators: true }
        ).populate('assignedCounselor', 'name email phone');

        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        await logActivity({
            leadId: lead._id,
            counselorId,
            type: 'COUNSELOR_ASSIGNED',
            title: 'Counselor Assigned',
            description: `Lead assigned to counselor`
        });

        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Send manual/automated CRM follow-up message to lead
// @route   POST /api/leads/:id/follow-up
// @access  Private
const sendLeadFollowUp = async (req, res) => {
    try {
        const { message } = req.body;
        if (typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Follow-up message content is required' });
        }

        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        // 1. Locate or create ChatConversation
        let conversation = null;
        if (lead.conversationId) {
            conversation = await ChatConversation.findById(lead.conversationId);
        }
        if (!conversation) {
            conversation = await ChatConversation.findOne({ 
                $or: [
                    { leadId: lead._id },
                    { sessionId: `wa_${lead.phone}` }
                ]
            }).sort({ updatedAt: -1 });
        }
        if (!conversation) {
            conversation = await ChatConversation.create({
                sessionId: `wa_${lead.phone || Date.now()}`,
                leadId: lead._id,
                mode: 'HYBRID',
                status: 'ACTIVE',
                followUpStatus: 'FOLLOW_UP_SENT',
                crmTag: 'FOLLOW_UP_SENT',
                lastMessageAt: new Date(),
                messages: []
            });
            lead.conversationId = conversation._id;
        }

        // 2. Append Follow-up Message to Conversation
        const followUpMsg = {
            sender: 'ADMIN',
            type: 'FOLLOW_UP',
            message: message.trim(),
            content: message.trim(),
            messageType: 'follow_up',
            deliveryStatus: 'read',
            metadata: {
                type: 'FOLLOW_UP',
                followUpTitle: 'Follow-up from Immigration Team',
                senderName: req.user?.name || 'Administrator',
                leadId: lead._id
            },
            timestamp: new Date()
        };

        conversation.messages.push(followUpMsg);
        conversation.status = 'ACTIVE';
        conversation.leadId = lead._id;
        conversation.crmTag = 'FOLLOW_UP_SENT';
        conversation.followUpStatus = 'FOLLOW_UP_SENT';
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // 3. Update Lead model
        lead.conversationId = conversation._id;
        lead.lastFollowUpAt = new Date();
        lead.followUpStatus = 'SENT';
        lead.lastInteractionAt = new Date();
        if (lead.status === 'NEEDS_FOLLOW_UP' || lead.status === 'NEW') {
            lead.status = 'FOLLOW_UP';
        }
        lead.followUpHistory = lead.followUpHistory || [];
        lead.followUpHistory.push({
            type: 'FOLLOW_UP_SENT',
            action: 'Follow-up Sent',
            message: message.trim(),
            sentAt: new Date(),
            status: 'SENT',
            sender: req.user?.name || 'Administrator'
        });
        await lead.save();

        await FollowUp.create({
            leadId: lead._id,
            conversationId: conversation._id,
            message: message.trim(),
            type: 'MANUAL',
            channel: 'WHATSAPP',
            status: 'SENT',
            scheduledAt: lead.lastFollowUpAt,
            sentAt: lead.lastFollowUpAt,
            assignedTo: req.user?._id
        });

        // 4. Log Activity
        await logActivity({
            leadId: lead._id,
            conversationId: conversation._id,
            counselorId: lead.assignedCounselor,
            type: 'FOLLOW_UP_SENT',
            title: 'Follow-up Sent',
            description: message.trim(),
            metadata: {
                message: message.trim(),
                status: 'SENT',
                sender: req.user?.name || 'Administrator'
            }
        });

        res.json({
            success: true,
            message: 'Follow-up dispatched successfully',
            data: {
                lead,
                conversation,
                followUpMessage: followUpMsg
            }
        });
    } catch (error) {
        console.error('[sendLeadFollowUp] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add note to lead
// @route   POST /api/leads/:id/notes
// @access  Private
const addLeadNote = async (req, res) => {
    try {
        const { note, text } = req.body;
        const noteContent = (note || text || '').trim();
        if (!noteContent) {
            return res.status(400).json({ success: false, message: 'Note text is required' });
        }

        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        const author = req.user?.name || 'Administrator';
        const formattedNote = `[${new Date().toLocaleDateString()} - ${author}]: ${noteContent}`;
        lead.notes = lead.notes ? `${lead.notes}\n${formattedNote}` : formattedNote;
        lead.lastInteractionAt = new Date();
        await lead.save();

        await logActivity({
            leadId: lead._id,
            counselorId: lead.assignedCounselor,
            type: 'NOTE_ADDED',
            title: 'Note Added',
            description: noteContent,
            metadata: { author }
        });

        res.json({ success: true, message: 'Note saved successfully', data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get lead activity timeline
// @route   GET /api/leads/:id/timeline
// @access  Private
const getLeadTimelineActivities = async (req, res) => {
    try {
        const timeline = await getLeadTimeline(req.params.id);
        res.json({ success: true, data: timeline });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createLead,
    getLeads,
    getLeadById,
    updateLeadStatus,
    updateLeadStage,
    assignCounselor,
    updateLead,
    deleteLead,
    sendLeadFollowUp,
    addLeadNote,
    getLeadTimelineActivities
};
