const Meeting = require('../models/Meeting');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Counselor = require('../models/Counselor');
const ChatConversation = require('../models/ChatConversation');
const { logActivity } = require('../services/activityService');

// Standard slots definition
const ALL_SLOTS = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM'
];

// @desc    Get available slots for calendar booking with double-booking exclusion
// @route   GET /api/meetings/slots
// @access  Public / Private
const getAvailableSlots = async (req, res) => {
    try {
        const { date, counselorId } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        const query = {
            date: targetDate,
            status: { $in: ['CONFIRMED', 'PENDING', 'Scheduled'] }
        };
        if (counselorId) query.counselorId = counselorId;

        const bookedMeetings = await Meeting.find(query);
        const bookedTimes = bookedMeetings.map(m => m.time);

        const availableSlots = ALL_SLOTS.map(time => ({
            time,
            available: !bookedTimes.includes(time)
        }));

        res.json({
            success: true,
            date: targetDate,
            slots: availableSlots
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Book a consultation meeting with Double-Booking Protection
// @route   POST /api/meetings/book
// @access  Public / Private
const bookMeeting = async (req, res) => {
    try {
        const {
            leadId,
            sessionId,
            fullName,
            phone,
            email,
            counselorId,
            date,
            time,
            consultationType,
            appointmentType, // 'ONLINE' | 'IN_PERSON'
            meetingType,
            serviceType,
            visaCategory,
            adminNotes,
            branch,
            countryInterest,
            notes
        } = req.body;

        if (!date || !time) {
            return res.status(400).json({ success: false, message: 'Date and time slot are required.' });
        }

        let activeLeadId = leadId;
        let activeCounselorId = counselorId;

        // 1. Resolve Lead (via explicit leadId, phone, or sessionId conversation)
        if (!activeLeadId && sessionId) {
            const existingConv = await ChatConversation.findOne({ sessionId });
            if (existingConv && existingConv.leadId) {
                activeLeadId = existingConv.leadId;
            }
        }

        if (!activeLeadId && phone) {
            let existingLead = await Lead.findOne({ phone });
            if (!existingLead) {
                existingLead = await Lead.create({
                    fullName: fullName || 'New Consultation Lead',
                    phone,
                    email: email || '',
                    countryInterest: countryInterest || 'UK',
                    preferredCountry: countryInterest || 'UK',
                    serviceType: serviceType || 'STUDY_VISA',
                    status: 'MEETING_BOOKED',
                    source: 'WhatsApp'
                });
            }
            activeLeadId = existingLead._id;
        }

        if (!activeLeadId) {
            // Fallback: create lead with available metadata
            const fallbackLead = await Lead.create({
                fullName: fullName || 'Consultation Candidate',
                phone: phone || `+92 300 ${Date.now().toString().slice(-7)}`,
                email: email || '',
                countryInterest: countryInterest || 'UK',
                preferredCountry: countryInterest || 'UK',
                serviceType: serviceType || 'STUDY_VISA',
                status: 'MEETING_BOOKED',
                source: 'WhatsApp'
            });
            activeLeadId = fallbackLead._id;
        }

        // 2. Resolve Counselor
        let counselorDoc = null;
        if (activeCounselorId) {
            counselorDoc = await User.findById(activeCounselorId) || await Counselor.findById(activeCounselorId);
        }
        if (!counselorDoc) {
            counselorDoc = await Counselor.findOne({ active: true }) ||
                await User.findOne({ role: 'COUNSELOR', active: true }) ||
                await User.findOne({ role: 'ADMIN' });
            if (counselorDoc) {
                activeCounselorId = counselorDoc.userId || counselorDoc._id;
            } else {
                try {
                    counselorDoc = await Counselor.create({
                        name: 'Dr. Zaheer Ahmad',
                        email: 'dr.zaheer@immigration.com',
                        phone: '+92 300 1234567',
                        specialization: ['Canada', 'UK', 'Australia'],
                        active: true
                    });
                    activeCounselorId = counselorDoc._id;
                } catch (cErr) {
                    counselorDoc = await Counselor.findOne();
                    if (counselorDoc) activeCounselorId = counselorDoc._id;
                }
            }
        }

        if (!activeLeadId || !activeCounselorId) {
            return res.status(400).json({ success: false, message: 'Valid lead and counselor are required for booking.' });
        }

        const counselorName = counselorDoc?.name || 'Senior Immigration Counselor';

        // ========================================================
        // MODULE 9: DOUBLE BOOKING PROTECTION (Anti-Overlap Check)
        // ========================================================
        const existingBooking = await Meeting.findOne({
            counselorId: activeCounselorId,
            date,
            time,
            status: { $in: ['CONFIRMED', 'PENDING', 'Scheduled'] }
        });

        if (existingBooking) {
            // Find alternative slots for that date
            const bookedMeetings = await Meeting.find({
                counselorId: activeCounselorId,
                date,
                status: { $in: ['CONFIRMED', 'PENDING', 'Scheduled'] }
            });
            const bookedTimes = bookedMeetings.map(m => m.time);
            const alternatives = ALL_SLOTS.filter(t => !bookedTimes.includes(t));

            return res.status(409).json({
                success: false,
                code: 'DOUBLE_BOOKING_COLLISION',
                message: `Double booking detected: Counselor is already booked at ${time} on ${date}. Please select an alternative slot.`,
                conflictingSlot: { date, time },
                availableAlternatives: alternatives
            });
        }

        // 3. Setup Link or In-Person Branch
        const isOnline = (consultationType || appointmentType || 'ONLINE').toUpperCase() === 'ONLINE';
        const consultationMode = meetingType || (isOnline ? 'Online Zoom Consultation' : 'In-Person Consultation');
        const meetingLink = isOnline
            ? `https://meet.jit.si/immigration-consultation-${Date.now().toString().slice(-6)}`
            : '';

        const meetingBranch = !isOnline && branch
            ? branch
            : { name: 'Main Office', address: 'Suite 402, Immigration Towers', city: 'London / Islamabad' };

        // 4. Create Meeting Record with Status PENDING
        const meeting = await Meeting.create({
            leadId: activeLeadId,
            sessionId: sessionId || null,
            counselorId: activeCounselorId,
            counselorName,
            appointmentType: isOnline ? 'ONLINE' : 'IN_PERSON',
            consultationType: isOnline ? 'ONLINE' : 'IN_PERSON',
            meetingType: consultationMode,
            serviceType: serviceType || 'STUDY_VISA',
            date,
            time,
            status: 'PENDING',
            meetingLink,
            branch: meetingBranch,
            notes: notes || ''
        });

        // 5. Update Lead Status in Sales Pipeline
        await Lead.findByIdAndUpdate(activeLeadId, {
            status: 'MEETING_BOOKED',
            assignedCounselor: activeCounselorId,
            lastInteractionAt: new Date()
        });

        // 6. Log in Activity Timeline: APPOINTMENT_REQUESTED
        await logActivity({
            leadId: activeLeadId,
            counselorId: activeCounselorId,
            type: 'APPOINTMENT_REQUESTED',
            title: `Appointment Request Submitted (${isOnline ? 'Online' : 'In-Person'})`,
            description: `Submitted for ${date} at ${time}. Counselor: ${counselorName}. Status: Pending Confirmation.`,
            metadata: { meetingId: meeting._id, date, time, consultationType: meeting.consultationType, status: 'PENDING' }
        });

        // 7. Add System Message to ChatConversation: 📅 Appointment Request Submitted
        let conversation = null;
        if (sessionId) {
            conversation = await ChatConversation.findOne({ sessionId });
        }
        if (!conversation && activeLeadId) {
            conversation = await ChatConversation.findOne({ leadId: activeLeadId }).sort({ updatedAt: -1 });
        }

        const consultLabel = isOnline ? 'Online Consultation' : 'In-Person Consultation';
        const formattedBookingMessage = `📅 Appointment Request Submitted\n\nStatus:\nPending Confirmation\n\nDetails:\nConsultation Type:\n${consultLabel}\n\nDate:\n${meeting.date}\n\nTime:\n${meeting.time}\n\nCounselor:\n${counselorName}`;

        const systemMessage = {
            sender: 'SYSTEM',
            type: 'APPOINTMENT_REQUESTED',
            message: formattedBookingMessage,
            content: formattedBookingMessage,
            messageType: 'card',
            deliveryStatus: 'read',
            metadata: {
                type: 'APPOINTMENT_REQUESTED',
                status: 'PENDING',
                meetingId: meeting._id,
                date: meeting.date,
                time: meeting.time,
                mode: consultationMode,
                consultationMode: consultationMode,
                meetingType: consultationMode,
                consultationType: meeting.consultationType,
                appointmentType: meeting.appointmentType,
                counselorName: counselorName
            },
            timestamp: new Date()
        };

        if (conversation) {
            conversation.messages.push(systemMessage);
            conversation.lastMessageAt = new Date();
            conversation.status = 'WAITING_HUMAN';
            conversation.followUpStatus = 'Appointment Pending Confirmation - Review Required';
            conversation.crmTag = 'APPOINTMENT_REQUESTED';
            conversation.meetingId = meeting._id;
            if (!conversation.leadId && activeLeadId) {
                conversation.leadId = activeLeadId;
            }
            await conversation.save();
            await Lead.findByIdAndUpdate(activeLeadId, { conversationId: conversation._id });
        }

        res.status(201).json({
            success: true,
            message: 'Appointment request submitted successfully. Status: PENDING.',
            data: {
                ...meeting.toObject(),
                counselorName,
                consultationMode
            },
            systemMessage
        });
    } catch (error) {
        console.error('[MeetingController] Booking error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Confirm an appointment by Admin
// @route   POST /api/meetings/confirm (or POST /api/meetings/:id/confirm)
// @access  Private / Public
const confirmMeeting = async (req, res) => {
    try {
        const meetingId = req.params.id || req.body.meetingId || req.body.id;
        const { sessionId, notes } = req.body;

        let meeting = null;
        if (meetingId) {
            meeting = await Meeting.findById(meetingId);
        }
        if (!meeting && sessionId) {
            meeting = await Meeting.findOne({ sessionId, status: { $in: ['PENDING', 'RESCHEDULED', 'Scheduled'] } }).sort({ createdAt: -1 });
        }

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Appointment to confirm not found.' });
        }

        // 1. Update Database: status = CONFIRMED, confirmedAt = now
        meeting.status = 'CONFIRMED';
        meeting.confirmedAt = new Date();
        if (notes) {
            meeting.adminNotes = (meeting.adminNotes ? meeting.adminNotes + ' | ' : '') + notes;
        }
        await meeting.save();

        const counselorName = meeting.counselorName || 'Senior Immigration Counselor';
        const isOnline = (meeting.consultationType || meeting.appointmentType || 'ONLINE').toUpperCase() === 'ONLINE';
        const consultTypeStr = isOnline ? 'Online' : 'In-Person';

        // 2. Add activity log: APPOINTMENT_CONFIRMED
        if (meeting.leadId) {
            await Lead.findByIdAndUpdate(meeting.leadId, {
                status: 'MEETING_BOOKED',
                followUpStatus: 'REQUIRED',
                lastInteractionAt: new Date()
            });

            await logActivity({
                leadId: meeting.leadId,
                counselorId: meeting.counselorId,
                type: 'APPOINTMENT_CONFIRMED',
                title: 'Consultation Confirmed',
                description: `Appointment on ${meeting.date} at ${meeting.time} confirmed. Counselor: ${counselorName}. Mode: ${consultTypeStr}`,
                metadata: { meetingId: meeting._id, date: meeting.date, time: meeting.time, status: 'CONFIRMED' }
            });
        }

        // 3. Send message to customer chat:
        // ✅ Your consultation has been confirmed.
        // Details:
        // Consultation Type: Online / In-Person
        // Date: Date
        // Time: Time
        // Counselor: Name
        const activeSessionId = sessionId || meeting.sessionId;
        let conversation = null;
        if (activeSessionId) {
            conversation = await ChatConversation.findOne({ sessionId: activeSessionId });
        }
        if (!conversation && meeting.leadId) {
            conversation = await ChatConversation.findOne({ leadId: meeting.leadId }).sort({ updatedAt: -1 });
        }

        const confirmationText = `✅ Your consultation has been confirmed.\n\nDetails:\n\nConsultation Type:\n${consultTypeStr}\n\nDate:\n${meeting.date}\n\nTime:\n${meeting.time}\n\nCounselor:\n${counselorName}`;

        const systemMessage = {
            sender: 'SYSTEM',
            type: 'APPOINTMENT_CONFIRMED',
            message: confirmationText,
            content: confirmationText,
            messageType: 'card',
            deliveryStatus: 'read',
            metadata: {
                type: 'APPOINTMENT_CONFIRMED',
                status: 'CONFIRMED',
                meetingId: meeting._id,
                date: meeting.date,
                time: meeting.time,
                mode: meeting.meetingType,
                consultationMode: meeting.meetingType,
                consultationType: meeting.consultationType || (isOnline ? 'ONLINE' : 'IN_PERSON'),
                counselorName,
                meetingLink: meeting.meetingLink
            },
            timestamp: new Date()
        };

        if (conversation) {
            conversation.messages.push(systemMessage);
            conversation.lastMessageAt = new Date();
            conversation.status = 'WAITING_HUMAN';
            conversation.followUpStatus = 'Appointment Confirmed - Follow Up Required';
            conversation.crmTag = 'APPOINTMENT_CONFIRMED';
            conversation.meetingId = meeting._id;
            await conversation.save();
        }

        res.json({
            success: true,
            message: 'Appointment confirmed successfully',
            data: meeting,
            systemMessage
        });
    } catch (error) {
        console.error('[MeetingController] Confirm error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reschedule an existing consultation appointment
// @route   POST /api/meetings/reschedule (or POST /api/meetings/:id/reschedule)
// @access  Public / Private
const rescheduleMeeting = async (req, res) => {
    try {
        const meetingId = req.params.id || req.body.meetingId || req.body.id;
        const { date, time, appointmentType, consultationType, meetingType, sessionId, notes } = req.body;

        if (!date || !time) {
            return res.status(400).json({ success: false, message: 'New date and time slot are required for rescheduling.' });
        }

        // Find existing meeting to reschedule
        let meeting = null;
        if (meetingId) {
            meeting = await Meeting.findById(meetingId);
        }
        if (!meeting && sessionId) {
            meeting = await Meeting.findOne({ sessionId, status: { $in: ['CONFIRMED', 'PENDING', 'RESCHEDULED', 'Scheduled'] } }).sort({ createdAt: -1 });
        }

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Active meeting to reschedule not found.' });
        }

        const counselorId = req.body.counselorId || meeting.counselorId;

        // Anti-overlap double booking check for new slot (excluding this meeting itself)
        const existingBooking = await Meeting.findOne({
            _id: { $ne: meeting._id },
            counselorId,
            date,
            time,
            status: { $in: ['CONFIRMED', 'PENDING', 'Scheduled'] }
        });

        if (existingBooking) {
            const bookedMeetings = await Meeting.find({
                counselorId,
                date,
                status: { $in: ['CONFIRMED', 'PENDING', 'Scheduled'] }
            });
            const bookedTimes = bookedMeetings.map(m => m.time);
            const alternatives = ALL_SLOTS.filter(t => !bookedTimes.includes(t));

            return res.status(409).json({
                success: false,
                code: 'DOUBLE_BOOKING_COLLISION',
                message: `Double booking detected: Counselor is already booked at ${time} on ${date}. Please select an alternative slot.`,
                conflictingSlot: { date, time },
                availableAlternatives: alternatives
            });
        }

        const oldDate = meeting.date;
        const oldTime = meeting.time;

        // Update appointment: date, time, status: RESCHEDULED, rescheduledAt
        meeting.date = date;
        meeting.time = time;
        meeting.status = 'RESCHEDULED';
        meeting.rescheduledAt = new Date();
        if (consultationType || appointmentType) {
            const isOnline = (consultationType || appointmentType).toUpperCase() === 'ONLINE';
            meeting.consultationType = isOnline ? 'ONLINE' : 'IN_PERSON';
            meeting.appointmentType = isOnline ? 'ONLINE' : 'IN_PERSON';
        }
        if (meetingType) {
            meeting.meetingType = meetingType;
        }
        if (notes) {
            meeting.adminNotes = (meeting.adminNotes ? meeting.adminNotes + ' | ' : '') + notes;
        }
        meeting.notes = (meeting.notes ? meeting.notes + ' | ' : '') + `Rescheduled from ${oldDate} ${oldTime} to ${date} ${time}`;
        await meeting.save();

        // Add activity: APPOINTMENT_RESCHEDULED
        if (meeting.leadId) {
            await logActivity({
                leadId: meeting.leadId,
                counselorId,
                type: 'APPOINTMENT_RESCHEDULED',
                title: 'Consultation Rescheduled',
                description: `Shifted from ${oldDate} ${oldTime} to ${date} ${time}`,
                metadata: { meetingId: meeting._id, oldDate, oldTime, newDate: date, newTime: time, status: 'RESCHEDULED' }
            });
        }

        // Send customer message:
        // 🔄 Your consultation has been rescheduled.
        // New Details:
        // Date: New Date
        // Time: New Time
        const activeSessionId = sessionId || meeting.sessionId;
        let conversation = null;
        if (activeSessionId) {
            conversation = await ChatConversation.findOne({ sessionId: activeSessionId });
        }
        if (!conversation && meeting.leadId) {
            conversation = await ChatConversation.findOne({ leadId: meeting.leadId }).sort({ updatedAt: -1 });
        }

        const rescheduleText = `🔄 Your consultation has been rescheduled.\n\nNew Details:\n\nDate:\n${date}\n\nTime:\n${time}`;

        const systemMessage = {
            sender: 'SYSTEM',
            type: 'APPOINTMENT_RESCHEDULED',
            message: rescheduleText,
            content: rescheduleText,
            messageType: 'card',
            deliveryStatus: 'read',
            metadata: {
                type: 'APPOINTMENT_RESCHEDULED',
                status: 'RESCHEDULED',
                meetingId: meeting._id,
                date: meeting.date,
                time: meeting.time,
                mode: meeting.meetingType,
                consultationMode: meeting.meetingType,
                consultationType: meeting.consultationType,
                counselorName: meeting.counselorName || 'Senior Immigration Counselor',
                oldDate,
                oldTime
            },
            timestamp: new Date()
        };

        if (conversation) {
            conversation.messages.push(systemMessage);
            conversation.lastMessageAt = new Date();
            conversation.status = 'WAITING_HUMAN';
            conversation.followUpStatus = 'Appointment Rescheduled - Review Required';
            conversation.crmTag = 'APPOINTMENT_RESCHEDULED';
            conversation.meetingId = meeting._id;
            await conversation.save();
        }

        res.status(200).json({
            success: true,
            message: 'Consultation successfully rescheduled',
            data: meeting,
            systemMessage
        });
    } catch (error) {
        console.error('[MeetingController] Reschedule error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Cancel an existing consultation appointment
// @route   POST /api/meetings/cancel (or POST /api/meetings/:id/cancel)
// @access  Public / Private
const cancelMeeting = async (req, res) => {
    try {
        const meetingId = req.params.id || req.body?.meetingId || req.body?.id || req.query?.meetingId || req.query?.id;
        const sessionId = req.body?.sessionId || req.query?.sessionId;
        const reason = req.body?.reason || req.body?.notes || req.query?.reason || 'Cancelled by Admin';

        let meeting = null;
        if (meetingId) {
            meeting = await Meeting.findById(meetingId);
        }
        if (!meeting && sessionId) {
            meeting = await Meeting.findOne({ sessionId, status: { $in: ['CONFIRMED', 'PENDING', 'RESCHEDULED', 'Scheduled'] } }).sort({ createdAt: -1 });
        }

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Active meeting not found' });
        }

        // 1. Update appointment: status = CANCELLED, cancelledAt = now
        meeting.status = 'CANCELLED';
        meeting.cancelledAt = new Date();
        if (reason) {
            meeting.adminNotes = (meeting.adminNotes ? meeting.adminNotes + ' | ' : '') + `Cancelled: ${reason}`;
            meeting.notes = (meeting.notes ? meeting.notes + ' | ' : '') + `Cancelled: ${reason}`;
        }
        await meeting.save();

        // 2. Add activity: APPOINTMENT_CANCELLED and CRM Follow-Up Activity
        if (meeting.leadId) {
            await Lead.findByIdAndUpdate(meeting.leadId, {
                status: 'NEEDS_FOLLOW_UP',
                followUpStatus: 'REQUIRED',
                stage: 'Follow-up Required',
                lastInteractionAt: new Date(),
                $push: {
                    followUpHistory: {
                        type: 'FOLLOW_UP_REQUIRED',
                        message: `Appointment on ${meeting.date} at ${meeting.time} was cancelled. Follow-up required.`,
                        sentAt: new Date(),
                        status: 'REQUIRED',
                        sender: 'SYSTEM'
                    }
                }
            });

            await logActivity({
                leadId: meeting.leadId,
                counselorId: meeting.counselorId,
                type: 'APPOINTMENT_CANCELLED',
                title: 'Consultation Cancelled',
                description: `Appointment on ${meeting.date} at ${meeting.time} was cancelled.${reason ? ' Reason: ' + reason : ''}`,
                metadata: { meetingId: meeting._id, date: meeting.date, time: meeting.time, status: 'CANCELLED' }
            });

            // CRM Follow-Up Activity
            await logActivity({
                leadId: meeting.leadId,
                counselorId: meeting.counselorId,
                type: 'FOLLOW_UP_REQUIRED',
                title: 'Appointment Cancelled - Follow Up Required',
                description: `Appointment on ${meeting.date} at ${meeting.time} was cancelled. Follow-up required to reschedule immigration consultation.`,
                metadata: { meetingId: meeting._id, date: meeting.date, time: meeting.time, status: 'NEEDS_FOLLOW_UP', customerName: meeting.fullName }
            });
        }

        // 3. Send customer message:
        // ❌ Your consultation has been cancelled.
        const activeSessionId = sessionId || meeting.sessionId;
        let conversation = null;
        if (activeSessionId) {
            conversation = await ChatConversation.findOne({ sessionId: activeSessionId });
        }
        if (!conversation && meeting.leadId) {
            conversation = await ChatConversation.findOne({ leadId: meeting.leadId }).sort({ updatedAt: -1 });
        }

        const cancelMessageText = '❌ Your consultation has been cancelled.';

        const systemMessage = {
            sender: 'SYSTEM',
            type: 'APPOINTMENT_CANCELLED',
            message: cancelMessageText,
            content: cancelMessageText,
            messageType: 'card',
            deliveryStatus: 'read',
            metadata: {
                type: 'APPOINTMENT_CANCELLED',
                status: 'CANCELLED',
                meetingId: meeting._id,
                date: meeting.date,
                time: meeting.time,
                counselorName: meeting.counselorName || 'Senior Immigration Counselor',
                reason: reason || ''
            },
            timestamp: new Date()
        };

        if (!conversation && (activeSessionId || meeting.leadId)) {
            conversation = await ChatConversation.create({
                sessionId: activeSessionId || `wa_${Date.now()}`,
                leadId: meeting.leadId,
                mode: 'HYBRID',
                status: 'NEEDS_FOLLOW_UP',
                followUpStatus: 'Appointment Cancelled - Follow Up Required',
                crmTag: 'APPOINTMENT_CANCELLED',
                lastMessageAt: new Date(),
                messages: [systemMessage]
            });
        } else if (conversation) {
            conversation.messages.push(systemMessage);
            conversation.status = 'NEEDS_FOLLOW_UP';
            conversation.followUpStatus = 'Appointment Cancelled - Follow Up Required';
            conversation.crmTag = 'APPOINTMENT_CANCELLED';
            conversation.lastMessageAt = new Date();
            await conversation.save();
        }

        res.json({
            success: true,
            message: 'Consultation successfully cancelled',
            data: meeting,
            systemMessage
        });
    } catch (error) {
        console.error('[MeetingController] Cancel error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMeetings = async (req, res) => {
    try {
        const { date, status, counselorId, leadId } = req.query;
        const query = {};

        if (date) query.date = date;
        if (status && status !== 'ALL') query.status = status;
        if (counselorId) query.counselorId = counselorId;
        if (leadId) query.leadId = leadId;

        const meetings = await Meeting.find(query)
            .populate('leadId', 'fullName phone email preferredCountry serviceType visaCategory countryInterest')
            .populate('counselorId', 'name email phone')
            .sort({ createdAt: -1, date: 1, time: 1 });

        console.log(`[Backend API] API URL called: ${req.originalUrl || '/api/meetings'}`);
        console.log(`[Backend API] Response status: 200`);
        console.log(`[Backend API] Returned appointments count: ${meetings.length}`);

        res.json({ success: true, count: meetings.length, data: meetings });
    } catch (error) {
        console.error(`[Backend API] API URL called: ${req.originalUrl || '/api/meetings'}`);
        console.error(`[Backend API] Response status: 500`);
        console.error(`[Backend API] Error:`, error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update meeting status
// @route   PATCH /api/meetings/:id/status
// @access  Private
const updateMeetingStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        if (status === 'CANCELLED') {
            return cancelMeeting(req, res);
        }
        if (status === 'CONFIRMED') {
            return confirmMeeting(req, res);
        }

        const meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }

        meeting.status = status || meeting.status;
        if (notes) meeting.notes = (meeting.notes ? meeting.notes + ' | ' : '') + notes;
        if (status === 'RESCHEDULED') meeting.rescheduledAt = new Date();
        await meeting.save();

        if (status === 'COMPLETED' && meeting.leadId) {
            await Lead.findByIdAndUpdate(meeting.leadId, {
                status: 'CONSULTATION_COMPLETED'
            });
        }

        res.json({ success: true, data: meeting });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAvailableSlots,
    bookMeeting,
    confirmMeeting,
    rescheduleMeeting,
    cancelMeeting,
    getMeetings,
    updateMeetingStatus
};
