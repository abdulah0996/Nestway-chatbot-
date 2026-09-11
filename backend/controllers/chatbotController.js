const ChatConversation = require('../models/ChatConversation');
const Lead = require('../models/Lead');
const {
    IMMIGRATION_SERVICES,
    getWelcomeAndNamePrompt,
    getPhonePrompt,
    getEmailPrompt,
    getServiceSelectionPrompt,
    getInitialServicePrompt,
    getQuestion,
    getTotalQuestions,
    AI_SAFETY_DISCLAIMER
} = require('../services/qualificationService');
const { calculateLeadScore } = require('../services/leadScoringService');
const { assignCounselorToLead } = require('../services/counselorAssignmentService');
const { scheduleFollowUpSequence } = require('../services/followUpService');
const { logActivity } = require('../services/activityService');

// Helper to detect initial greetings
const isGreetingText = (txt) => {
    if (!txt) return true;
    const clean = String(txt).trim().toLowerCase();
    return ['hi', 'hello', 'hey', 'start', 'salam', 'assalam o alaikum', 'aoa', 'hola', 'good morning', 'good afternoon', 'good evening', 'help', 'menu', 'reset'].includes(clean);
};

// Helper to upsert Lead record in MongoDB
const upsertLeadRecord = async ({ phone, fullName, email, source, serviceType, status, conversationId }) => {
    if (!phone) return null;
    let lead = await Lead.findOne({ phone: String(phone).trim() });
    if (!lead) {
        lead = new Lead({
            phone: String(phone).trim(),
            fullName: fullName ? String(fullName).trim() : 'New Lead',
            email: email ? String(email).trim().toLowerCase() : '',
            source: source || 'Website AI Chatbot',
            serviceType: serviceType || 'STUDY_VISA',
            status: status || 'QUALIFYING',
            conversationId
        });
        await lead.save();
        await logActivity({
            leadId: lead._id,
            conversationId,
            type: 'LEAD_CREATED',
            title: 'Lead Captured via Chatbot',
            description: `${lead.fullName} (${lead.phone}) entered sales pipeline via ${lead.source}`
        });
    } else {
        if (fullName && (!lead.fullName || lead.fullName === 'New Lead')) {
            lead.fullName = String(fullName).trim();
        }
        if (email) {
            lead.email = String(email).trim().toLowerCase();
        }
        if (serviceType) {
            lead.serviceType = serviceType;
            lead.visaCategory = IMMIGRATION_SERVICES[serviceType]?.name || lead.visaCategory;
        }
        if (conversationId) lead.conversationId = conversationId;
        await lead.save();
    }
    return lead;
};

// @desc    Process incoming WhatsApp or Chatbot message
// @route   POST /api/chat/message
// @access  Public
const handleChatMessage = async (req, res) => {
    try {
        const {
            sessionId,
            message,
            selectedOption,
            phone: incomingPhone,
            fullName: incomingFullName,
            email: incomingEmail,
            serviceType: incomingServiceType,
            source: incomingSource
        } = req.body;

        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'Session ID is required' });
        }

        // 1. Fetch or initialize conversation
        let conversation = await ChatConversation.findOne({ sessionId });
        if (!conversation) {
            conversation = await ChatConversation.create({
                sessionId,
                mode: 'HYBRID',
                leadCaptureStage: 'NAME',
                messages: [],
                answers: {}
            });
        }

        // Ensure answers and stage exist
        conversation.answers = conversation.answers || {};
        if (!conversation.leadCaptureStage) {
            conversation.leadCaptureStage = conversation.serviceType ? 'QUALIFICATION' : 'NAME';
        }

        // 2. Check if Human Counselor has taken over and conversation is in HUMAN mode
        if (conversation.mode === 'HUMAN' || conversation.automationPaused) {
            const rawUserText = message || (selectedOption && (selectedOption.value || selectedOption.label)) || selectedOption || '';
            const userText = String(rawUserText).trim();
            const senderType = (req.body.sender || '').toUpperCase() === 'COUNSELOR' ? 'COUNSELOR' : 'USER';

            if (userText) {
                const newMsg = {
                    sender: senderType,
                    message: userText,
                    messageType: req.body.messageType || 'text',
                    deliveryStatus: senderType === 'USER' ? 'delivered' : 'sent',
                    timestamp: new Date()
                };
                conversation.messages.push(newMsg);
                conversation.lastMessageAt = new Date();
                if (senderType === 'USER') {
                    conversation.status = 'WAITING_HUMAN';
                }
                await conversation.save();

                if (conversation.leadId) {
                    await logActivity({
                        leadId: conversation.leadId,
                        conversationId: conversation._id,
                        type: senderType === 'USER' ? 'USER_MESSAGE_HUMAN_MODE' : 'COUNSELOR_MESSAGE',
                        title: senderType === 'USER' ? 'User Message in Human Mode' : 'Counselor Reply',
                        description: `${senderType}: "${userText.slice(0, 60)}..."`
                    });

                    if (senderType === 'USER' && conversation.followUpStatus === 'FOLLOW_UP_SENT') {
                        conversation.followUpStatus = 'FOLLOW_UP_REPLIED';
                        await conversation.save();
                        await Lead.findByIdAndUpdate(conversation.leadId, {
                            followUpStatus: 'REPLIED',
                            lastInteractionAt: new Date(),
                            $push: {
                                followUpHistory: {
                                    type: 'FOLLOW_UP_REPLIED',
                                    action: 'Customer Replied to Follow-up',
                                    message: userText,
                                    sentAt: new Date(),
                                    status: 'REPLIED',
                                    sender: 'CUSTOMER'
                                }
                            }
                        });
                        await logActivity({
                            leadId: conversation.leadId,
                            conversationId: conversation._id,
                            type: 'FOLLOW_UP_REPLIED',
                            title: 'Follow-up Replied',
                            description: `Customer replied: "${userText.slice(0, 100)}"`,
                            metadata: { message: userText, status: 'REPLIED', sender: 'CUSTOMER' }
                        });
                    }
                }
            }

            return res.json({
                success: true,
                mode: 'HUMAN',
                status: conversation.status,
                automationPaused: true,
                waitingForCounselor: senderType === 'USER',
                sender: senderType,
                botResponse: null, // AI response generation remains completely disabled
                message: senderType === 'USER'
                    ? 'Message received and saved. Waiting for counselor response.'
                    : 'Counselor message sent successfully.',
                savedMessage: conversation.messages[conversation.messages.length - 1] || null,
                messages: conversation.messages
            });
        }

        const rawUserText = message || (selectedOption && (selectedOption.value || selectedOption.label)) || selectedOption || '';
        const userText = String(rawUserText).trim();

        // Detect if user is connected via WhatsApp (phone number in sessionId or source)
        const isWaUser = (sessionId.startsWith('wa_') && !sessionId.startsWith('wa_session_')) ||
            incomingSource === 'WhatsApp' ||
            req.body.isWhatsApp === true;

        const waExtractedPhone = (sessionId.startsWith('wa_') && !sessionId.startsWith('wa_session_'))
            ? sessionId.replace('wa_', '').trim()
            : (incomingPhone || null);

        // Record User Message in history if provided
        if (userText) {
            conversation.messages.push({
                sender: 'USER',
                message: userText,
                messageType: 'text',
                deliveryStatus: 'read',
                timestamp: new Date()
            });

            // Check if this user message is a reply to an active follow-up
            if (conversation.followUpStatus === 'FOLLOW_UP_SENT') {
                conversation.followUpStatus = 'FOLLOW_UP_REPLIED';
                if (conversation.leadId) {
                    await Lead.findByIdAndUpdate(conversation.leadId, {
                        followUpStatus: 'REPLIED',
                        lastInteractionAt: new Date(),
                        $push: {
                            followUpHistory: {
                                type: 'FOLLOW_UP_REPLIED',
                                action: 'Customer Replied to Follow-up',
                                message: userText,
                                sentAt: new Date(),
                                status: 'REPLIED',
                                sender: 'CUSTOMER'
                            }
                        }
                    });
                    await logActivity({
                        leadId: conversation.leadId,
                        conversationId: conversation._id,
                        type: 'FOLLOW_UP_REPLIED',
                        title: 'Follow-up Replied',
                        description: `Customer replied: "${userText.slice(0, 100)}"`,
                        metadata: { message: userText, status: 'REPLIED', sender: 'CUSTOMER' }
                    });
                }
            }
        }

        // Check if user requested Human Counselor
        const lowerText = userText.toLowerCase();
        if (
            lowerText === 'talk to counselor' ||
            lowerText === 'talk_counselor' ||
            lowerText === 'counselor' ||
            lowerText.includes('talk to counselor') ||
            lowerText.includes('human agent') ||
            lowerText === 'human'
        ) {
            conversation.mode = 'HUMAN';
            conversation.automationPaused = true;
            conversation.status = 'WAITING_HUMAN';

            const handoffMsg = {
                sender: 'SYSTEM',
                message: 'You have connected with our Senior Immigration Team. Conversational AI auto-replies are paused. An administrator or counselor will reply directly to this thread.',
                messageType: 'text',
                deliveryStatus: 'read',
                timestamp: new Date()
            };
            conversation.messages.push(handoffMsg);
            conversation.lastMessageAt = new Date();
            await conversation.save();

            return res.json({
                success: true,
                mode: 'HUMAN',
                status: 'WAITING_HUMAN',
                automationPaused: true,
                waitingForCounselor: true,
                botResponse: 'Connecting you to our Senior Immigration Advisor. Human Mode activated.',
                messages: conversation.messages
            });
        }

        let stage = conversation.leadCaptureStage || 'NAME';
        let answers = conversation.answers || {};

        // =====================================================================
        // STEP 1 & 2: Welcome Message & Ask Full Name
        // =====================================================================
        if (stage === 'NAME') {
            // Check if user has answered with their full name
            const isFirstTouch = isGreetingText(userText) || conversation.messages.length <= 1;

            if (isFirstTouch && !conversation.answers.fullName) {
                const welcomePrompt = getWelcomeAndNamePrompt();
                conversation.messages.push({
                    sender: 'AI',
                    message: welcomePrompt.message,
                    messageType: 'text',
                    options: welcomePrompt.options,
                    actionChips: welcomePrompt.actionChips,
                    timestamp: new Date()
                });
                conversation.lastMessageAt = new Date();
                await conversation.save();

                return res.json({
                    success: true,
                    isComplete: false,
                    stage: 'NAME',
                    stepIndex: 0,
                    botResponse: welcomePrompt.message,
                    options: welcomePrompt.options,
                    actionChips: welcomePrompt.actionChips,
                    messages: conversation.messages
                });
            }

            // User provided full name!
            const capturedName = userText;
            answers.fullName = capturedName;
            conversation.answers = answers;
            conversation.markModified('answers');

            // Check Step 3: Phone number capture
            if (isWaUser && waExtractedPhone) {
                // WhatsApp user: automatically use WhatsApp number!
                answers.phone = waExtractedPhone;
                conversation.answers = answers;
                conversation.markModified('answers');

                // Upsert Lead record in MongoDB
                const lead = await upsertLeadRecord({
                    phone: answers.phone,
                    fullName: answers.fullName,
                    source: 'WhatsApp',
                    status: 'QUALIFYING',
                    conversationId: conversation._id
                });
                if (lead) conversation.leadId = lead._id;

                // Move directly to Step 4: Ask email (optional)
                conversation.leadCaptureStage = 'EMAIL';
                const emailPrompt = getEmailPrompt(answers.fullName, answers.phone);

                conversation.messages.push({
                    sender: 'AI',
                    message: emailPrompt.message,
                    messageType: 'quick_reply',
                    options: emailPrompt.options,
                    actionChips: emailPrompt.actionChips,
                    timestamp: new Date()
                });
                conversation.lastMessageAt = new Date();
                await conversation.save();

                return res.json({
                    success: true,
                    isComplete: false,
                    stage: 'EMAIL',
                    lead,
                    botResponse: emailPrompt.message,
                    options: emailPrompt.options,
                    actionChips: emailPrompt.actionChips,
                    messages: conversation.messages
                });
            } else {
                // Website user: Ask for phone number
                conversation.leadCaptureStage = 'PHONE';
                const phonePrompt = getPhonePrompt(answers.fullName);

                conversation.messages.push({
                    sender: 'AI',
                    message: phonePrompt.message,
                    messageType: 'text',
                    options: phonePrompt.options,
                    actionChips: phonePrompt.actionChips,
                    timestamp: new Date()
                });
                conversation.lastMessageAt = new Date();
                await conversation.save();

                return res.json({
                    success: true,
                    isComplete: false,
                    stage: 'PHONE',
                    botResponse: phonePrompt.message,
                    options: phonePrompt.options,
                    actionChips: phonePrompt.actionChips,
                    messages: conversation.messages
                });
            }
        }

        // =====================================================================
        // STEP 3: Capture Phone Number (for website user)
        // =====================================================================
        if (stage === 'PHONE') {
            const capturedPhone = userText;
            answers.phone = capturedPhone;
            conversation.answers = answers;
            conversation.markModified('answers');

            // Save basic lead information into the Lead model
            const lead = await upsertLeadRecord({
                phone: answers.phone,
                fullName: answers.fullName,
                source: 'Website AI Chatbot',
                status: 'QUALIFYING',
                conversationId: conversation._id
            });
            if (lead) conversation.leadId = lead._id;

            // Move to Step 4: Ask email (optional)
            conversation.leadCaptureStage = 'EMAIL';
            const emailPrompt = getEmailPrompt(answers.fullName);

            conversation.messages.push({
                sender: 'AI',
                message: emailPrompt.message,
                messageType: 'quick_reply',
                options: emailPrompt.options,
                actionChips: emailPrompt.actionChips,
                timestamp: new Date()
            });
            conversation.lastMessageAt = new Date();
            await conversation.save();

            return res.json({
                success: true,
                isComplete: false,
                stage: 'EMAIL',
                lead,
                botResponse: emailPrompt.message,
                options: emailPrompt.options,
                actionChips: emailPrompt.actionChips,
                messages: conversation.messages
            });
        }

        // =====================================================================
        // STEP 4: Ask Email (Optional)
        // =====================================================================
        if (stage === 'EMAIL') {
            const upperInput = userText.toUpperCase();
            const isSkip = upperInput === 'SKIP' ||
                upperInput.includes('SKIP') ||
                upperInput === 'NO' ||
                upperInput === 'NONE' ||
                upperInput === 'N/A';

            answers.email = isSkip ? '' : userText;
            conversation.answers = answers;
            conversation.markModified('answers');

            // Update email in Lead model
            if (conversation.leadId) {
                await Lead.findByIdAndUpdate(conversation.leadId, { email: answers.email });
            }

            // Move to Step 5: Ask immigration service
            conversation.leadCaptureStage = 'SERVICE';
            const servicePrompt = getServiceSelectionPrompt(answers.fullName);

            conversation.messages.push({
                sender: 'AI',
                message: servicePrompt.message,
                messageType: 'quick_reply',
                options: servicePrompt.options,
                actionChips: servicePrompt.actionChips,
                timestamp: new Date()
            });
            conversation.lastMessageAt = new Date();
            await conversation.save();

            return res.json({
                success: true,
                isComplete: false,
                stage: 'SERVICE',
                botResponse: servicePrompt.message,
                options: servicePrompt.options,
                actionChips: servicePrompt.actionChips,
                messages: conversation.messages
            });
        }

        // =====================================================================
        // STEP 5: Ask Immigration Service Selection
        // =====================================================================
        if (stage === 'SERVICE') {
            let activeServiceType = null;
            const upperText = userText.toUpperCase();

            if (upperText.includes('STUDY') || upperText.includes('STUDENT')) activeServiceType = 'STUDY_VISA';
            else if (upperText.includes('SKILLED') || upperText.includes('WORK') || upperText.includes('PR')) activeServiceType = 'SKILLED_VISA';
            else if (upperText.includes('BUSINESS') || upperText.includes('INVESTOR')) activeServiceType = 'BUSINESS_VISA';
            else if (upperText.includes('VISIT') || upperText.includes('TOURIST')) activeServiceType = 'VISIT_VISA';
            else if (incomingServiceType && IMMIGRATION_SERVICES[incomingServiceType]) activeServiceType = incomingServiceType;

            if (!activeServiceType) {
                // Re-prompt service selection
                const servicePrompt = getServiceSelectionPrompt(answers.fullName);
                conversation.messages.push({
                    sender: 'AI',
                    message: servicePrompt.message,
                    messageType: 'quick_reply',
                    options: servicePrompt.options,
                    actionChips: servicePrompt.actionChips,
                    timestamp: new Date()
                });
                conversation.lastMessageAt = new Date();
                await conversation.save();

                return res.json({
                    success: true,
                    isComplete: false,
                    stage: 'SERVICE',
                    botResponse: servicePrompt.message,
                    options: servicePrompt.options,
                    actionChips: servicePrompt.actionChips,
                    messages: conversation.messages
                });
            }

            // Valid Service Selected! Advance to QUALIFICATION
            conversation.serviceType = activeServiceType;
            conversation.leadCaptureStage = 'QUALIFICATION';
            conversation.currentQuestionIndex = 0;

            // Update Lead model with selected service
            if (conversation.leadId) {
                await Lead.findByIdAndUpdate(conversation.leadId, {
                    serviceType: activeServiceType,
                    visaCategory: IMMIGRATION_SERVICES[activeServiceType].name
                });
            }

            // Fetch first qualification question for the selected service
            const firstQuestion = getQuestion(activeServiceType, 0);

            conversation.messages.push({
                sender: 'AI',
                message: firstQuestion.text,
                messageType: 'quick_reply',
                options: firstQuestion.options,
                actionChips: firstQuestion.options.map(opt => ({ label: opt.label, action: opt.value })),
                timestamp: new Date()
            });
            conversation.lastMessageAt = new Date();
            await conversation.save();

            return res.json({
                success: true,
                isComplete: false,
                stage: 'QUALIFICATION',
                serviceType: activeServiceType,
                stepIndex: 0,
                totalQuestions: getTotalQuestions(activeServiceType),
                botResponse: firstQuestion.text,
                options: firstQuestion.options,
                actionChips: firstQuestion.options.map(opt => ({ label: opt.label, action: opt.value })),
                messages: conversation.messages
            });
        }

        // =====================================================================
        // STEP 5.5: Post-Qualification Conversational Responses (e.g. after Resume AI)
        // =====================================================================
        if (stage === 'COMPLETED') {
            const activeServiceType = conversation.serviceType || 'STUDY_VISA';
            const lower = userText.toLowerCase();
            let reply = `Hello! I am your 24/7 AI Immigration Assistant. Your profile is already pre-qualified for **${(IMMIGRATION_SERVICES[activeServiceType] && IMMIGRATION_SERVICES[activeServiceType].name) || 'Visa Application'}**.\n\nHow can I help you take the next step today?`;

            if (lower.includes('book') || lower.includes('consultation') || lower.includes('meeting') || lower.includes('slot') || lower.includes('appointment')) {
                reply = `You can easily book a 1-on-1 consultation with our Senior Immigration Counselor. Please click **📅 Book Consultation** below to choose your slot!`;
            } else if (lower.includes('university') || lower.includes('options') || lower.includes('college')) {
                reply = `Top university options for ${answers.preferredCountry || 'your destination'}:\n1. University of Hertfordshire\n2. Aston University (up to £3,500 Merit Grant)\n3. Birmingham City University\n\nWould you like to initiate an application?`;
            } else if (lower.includes('scholarship')) {
                reply = `Based on your evaluation, you qualify for Academic Merit Waivers (£2,000 - £4,500). Please speak with our Counselor to submit your scholarship dossier.`;
            } else if (lower.includes('counselor') || lower.includes('human') || lower.includes('agent')) {
                reply = `You can connect directly with human staff anytime. Tap **👨‍💼 Talk to Counselor** below.`;
            }

            const actionChips = [
                { label: '📅 Book Consultation', action: 'book_meeting' },
                { label: '🎓 University Options', action: 'university_options' },
                { label: '🏆 Scholarship Details', action: 'scholarship_details' },
                { label: '👨‍💼 Talk to Counselor', action: 'talk_counselor' }
            ];

            conversation.messages.push({
                sender: 'AI',
                message: reply,
                messageType: 'text',
                actionChips,
                timestamp: new Date()
            });
            conversation.lastMessageAt = new Date();
            await conversation.save();

            return res.json({
                success: true,
                isComplete: true,
                stage: 'COMPLETED',
                serviceType: activeServiceType,
                botResponse: reply,
                actionChips,
                messages: conversation.messages
            });
        }

        // =====================================================================
        // STEP 6: Continue Existing Dynamic Qualification Questions
        // =====================================================================
        const activeServiceType = conversation.serviceType || 'STUDY_VISA';
        const currentIdx = conversation.currentQuestionIndex || 0;
        const currentQuestion = getQuestion(activeServiceType, currentIdx);

        // Save answer to the question just answered
        if (currentQuestion && userText) {
            answers[currentQuestion.field] = userText;
            conversation.answers = answers;
            conversation.markModified('answers');
            conversation.currentQuestionIndex = currentIdx + 1;
        }

        const nextIdx = conversation.currentQuestionIndex || 0;
        const totalQ = getTotalQuestions(activeServiceType);

        // Check if more qualification questions remain
        if (nextIdx < totalQ) {
            const nextQuestion = getQuestion(activeServiceType, nextIdx);

            conversation.messages.push({
                sender: 'AI',
                message: nextQuestion.text,
                messageType: 'quick_reply',
                options: nextQuestion.options,
                actionChips: nextQuestion.options.map(opt => ({ label: opt.label, action: opt.value })),
                timestamp: new Date()
            });
            conversation.lastMessageAt = new Date();
            await conversation.save();

            return res.json({
                success: true,
                isComplete: false,
                stage: 'QUALIFICATION',
                serviceType: activeServiceType,
                stepIndex: nextIdx,
                totalQuestions: totalQ,
                botResponse: nextQuestion.text,
                options: nextQuestion.options,
                actionChips: nextQuestion.options.map(opt => ({ label: opt.label, action: opt.value })),
                messages: conversation.messages
            });
        }

        // =====================================================================
        // Qualification Questions Finished: Run Lead Scoring & Finalize Lead!
        // =====================================================================
        conversation.leadCaptureStage = 'COMPLETED';
        const scoreReport = calculateLeadScore(activeServiceType, answers);

        // Assign specialized counselor
        const assignedCounselorInfo = await assignCounselorToLead({
            serviceType: activeServiceType,
            preferredCountry: answers.preferredCountry || answers.destinationCountry || 'UK'
        });

        // Finalize Lead record with all qualification data and score
        const leadPhone = answers.phone || incomingPhone || `WA_${sessionId.slice(-6)}`;
        const leadName = answers.fullName || incomingFullName || 'Lead';
        const leadEmail = answers.email || incomingEmail || '';

        let lead = null;
        if (conversation.leadId) {
            lead = await Lead.findById(conversation.leadId);
        }
        if (!lead) {
            lead = await Lead.findOne({ phone: leadPhone });
        }

        if (!lead) {
            lead = new Lead({
                phone: leadPhone,
                fullName: leadName,
                email: leadEmail,
                source: isWaUser ? 'WhatsApp' : 'Website AI Chatbot',
                serviceType: activeServiceType,
                preferredCountry: answers.preferredCountry || answers.destinationCountry || 'UK',
                countryInterest: answers.preferredCountry || answers.destinationCountry || 'UK',
                qualificationData: answers,
                leadScore: scoreReport.totalScore,
                leadTemperature: scoreReport.temperature,
                scoreReasons: scoreReport.scoreReasons,
                status: 'QUALIFIED',
                assignedCounselor: assignedCounselorInfo ? assignedCounselorInfo.counselorId : null,
                conversationId: conversation._id
            });
            await lead.save();
        } else {
            lead.fullName = leadName;
            lead.email = leadEmail;
            lead.serviceType = activeServiceType;
            lead.preferredCountry = answers.preferredCountry || answers.destinationCountry || lead.preferredCountry;
            lead.countryInterest = answers.preferredCountry || answers.destinationCountry || lead.countryInterest;
            lead.qualificationData = answers;
            lead.markModified('qualificationData');
            lead.leadScore = scoreReport.totalScore;
            lead.leadTemperature = scoreReport.temperature;
            lead.scoreReasons = scoreReport.scoreReasons;
            lead.status = 'QUALIFIED';
            if (assignedCounselorInfo) lead.assignedCounselor = assignedCounselorInfo.counselorId;
            lead.conversationId = conversation._id;
            await lead.save();
        }

        conversation.leadId = lead._id;
        if (assignedCounselorInfo) conversation.assignedCounselor = assignedCounselorInfo.counselorId;

        // Schedule automated follow-up sequence
        await scheduleFollowUpSequence(lead, conversation._id);

        // Completion Response Message
        const completionMsg = `🎉 **AI Qualification Assessment Complete!**\n\n` +
            `Candidate: **${lead.fullName}**\n` +
            `Service: **${IMMIGRATION_SERVICES[activeServiceType].name}**\n` +
            `Target Country: **${lead.preferredCountry}**\n` +
            `Lead Score: **${scoreReport.totalScore}% (${scoreReport.temperature} LEAD)**\n` +
            `Assigned Specialist: **${assignedCounselorInfo ? assignedCounselorInfo.name : 'Senior Counselor'}**\n\n` +
            `Based on your profile evaluation:\n` +
            scoreReport.scoreReasons.map(r => `• ${r}`).join('\n') + `\n\n` +
            `${AI_SAFETY_DISCLAIMER}\n\n` +
            `Would you like to reserve an appointment slot or discuss document requirements?`;

        const actionChips = [
            { label: '📅 Book Consultation', action: 'book_meeting' },
            { label: '🎓 University Options', action: 'university_options' },
            { label: '🏆 Scholarship Details', action: 'scholarship_details' },
            { label: '👨‍💼 Talk to Counselor', action: 'talk_counselor' }
        ];

        conversation.messages.push({
            sender: 'AI',
            message: completionMsg,
            messageType: 'card',
            actionChips,
            timestamp: new Date()
        });
        conversation.lastMessageAt = new Date();
        await conversation.save();

        return res.json({
            success: true,
            isComplete: true,
            stage: 'COMPLETED',
            serviceType: activeServiceType,
            scoreReport,
            lead,
            botResponse: completionMsg,
            actionChips,
            messages: conversation.messages
        });
    } catch (error) {
        console.error('[ChatbotController] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get complete chat session history
// @route   GET /api/chat/session/:sessionId
// @access  Public
const getChatSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const conversation = await ChatConversation.findOne({ sessionId })
            .populate('leadId')
            .populate('assignedCounselor', 'name email phone specialization');

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.json({ success: true, data: conversation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Human Counselor Takeover (Switches mode to HUMAN and pauses AI conversational replies)
// @route   POST /api/chat/takeover
// @access  Private / Public
const takeoverChat = async (req, res) => {
    try {
        const { sessionId, counselorId, counselorName } = req.body;
        const conversation = await ChatConversation.findOne({ sessionId });
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        conversation.mode = 'HUMAN';
        conversation.automationPaused = true;
        conversation.status = 'WAITING_HUMAN';
        if (counselorId) conversation.assignedCounselor = counselorId;

        conversation.messages.push({
            sender: 'SYSTEM',
            message: 'You have connected with our immigration advisor team. Conversational AI replies are paused. An administrator or counselor will respond shortly.',
            messageType: 'text',
            deliveryStatus: 'read',
            timestamp: new Date()
        });

        await conversation.save();

        if (conversation.leadId) {
            await logActivity({
                leadId: conversation.leadId,
                conversationId: conversation._id,
                type: 'HUMAN_TAKEOVER',
                title: 'Human Mode Enabled',
                description: 'User requested counselor assistance. Conversation waiting in Admin Inbox.'
            });
        }

        res.json({ success: true, message: 'Switched to Human Mode successfully', data: conversation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Resume AI Hybrid Mode
// @route   POST /api/chat/resume-ai
// @access  Private
const resumeAi = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const conversation = await ChatConversation.findOne({ sessionId });
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        conversation.mode = 'HYBRID';
        conversation.automationPaused = false;
        conversation.status = 'ACTIVE';

        conversation.messages.push({
            sender: 'SYSTEM',
            message: 'AI Assistant has resumed automated assistance.',
            messageType: 'text',
            deliveryStatus: 'read',
            timestamp: new Date()
        });

        await conversation.save();

        res.json({ success: true, message: 'AI Hybrid mode resumed', data: conversation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin or Counselor sends a direct message to a chat session
// @route   POST /api/chat/counselor/message
// @access  Public / Private
const sendCounselorReply = async (req, res) => {
    try {
        const { sessionId, counselorName, counselorId, sender } = req.body;
        const msgText = String(req.body.message || req.body.content || '').trim();
        if (!sessionId || !msgText) {
            return res.status(400).json({ success: false, message: 'Session ID and message content are required' });
        }

        let conversation = await ChatConversation.findOne({ sessionId });
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        // Ensure mode is HUMAN when admin/counselor replies
        conversation.mode = 'HUMAN';
        conversation.automationPaused = true;
        if (counselorId) conversation.assignedCounselor = counselorId;

        const senderType = (sender && (sender.toUpperCase() === 'COUNSELOR' || sender.toUpperCase() === 'ADMIN'))
            ? sender.toUpperCase()
            : 'ADMIN';

        const replyMsg = {
            sender: senderType,
            message: msgText,
            content: msgText,
            messageType: req.body.messageType || 'text',
            deliveryStatus: 'sent',
            metadata: {
                counselorName: counselorName || (senderType === 'ADMIN' ? 'Admin / Counselor' : 'Senior Counselor')
            },
            timestamp: new Date()
        };

        conversation.messages.push(replyMsg);
        conversation.lastMessageAt = new Date();
        conversation.status = 'ACTIVE';
        await conversation.save();

        if (conversation.leadId) {
            await logActivity({
                leadId: conversation.leadId,
                conversationId: conversation._id,
                type: 'COUNSELOR_MESSAGE',
                title: `${senderType} Replied to Chat`,
                description: `${counselorName || senderType} replied: "${msgText.slice(0, 60)}..."`
            });
        }

        res.json({
            success: true,
            message: 'Message sent successfully',
            mode: 'HUMAN',
            data: replyMsg,
            savedMessage: {
                sender: senderType,
                content: msgText,
                message: msgText,
                timestamp: replyMsg.timestamp
            },
            conversationId: conversation._id,
            sessionId: conversation.sessionId,
            messages: conversation.messages
        });
    } catch (error) {
        console.error('[sendCounselorReply] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Assign counselor to conversation
// @route   POST /api/chat/assign
// @access  Private (Admin)
const assignCounselorToChat = async (req, res) => {
    try {
        const { sessionId, counselorId, counselorName } = req.body;
        let conversation = await ChatConversation.findOne({ sessionId });
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        if (counselorId) conversation.assignedCounselor = counselorId;
        await conversation.save();

        if (conversation.leadId && counselorId) {
            await Lead.findByIdAndUpdate(conversation.leadId, { assignedCounselor: counselorId });
        }

        res.json({
            success: true,
            message: `Assigned to ${counselorName || 'counselor'} successfully`,
            data: conversation
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add internal note to conversation
// @route   POST /api/chat/notes
// @access  Private (Admin)
const addChatNote = async (req, res) => {
    try {
        const { sessionId, author } = req.body;
        const text = req.body.text || req.body.note;
        if (!sessionId || !text) {
            return res.status(400).json({ success: false, message: 'sessionId and note text are required' });
        }

        let conversation = await ChatConversation.findOne({ sessionId });
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const noteObj = {
            id: 'note_' + Date.now(),
            author: author || 'Admin',
            text: String(text).trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date()
        };

        if (!conversation.answers) conversation.answers = {};
        if (!conversation.answers.notes) conversation.answers.notes = [];
        conversation.answers.notes.push(noteObj);
        conversation.markModified('answers');
        await conversation.save();

        if (conversation.leadId) {
            const lead = await Lead.findById(conversation.leadId);
            if (lead) {
                if (!lead.notes) lead.notes = [];
                lead.notes.push({
                    text: noteObj.text,
                    createdBy: author || 'Admin',
                    createdAt: new Date()
                });
                await lead.save();
            }
        }

        res.json({ success: true, message: 'Note added successfully', data: noteObj });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Close conversation
// @route   POST /api/chat/close
// @access  Private (Admin)
const closeConversation = async (req, res) => {
    try {
        const { sessionId } = req.body;
        let conversation = await ChatConversation.findOne({ sessionId });
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        conversation.status = 'CLOSED';
        conversation.messages.push({
            sender: 'SYSTEM',
            message: 'This conversation has been marked as closed by Administrator.',
            messageType: 'text',
            deliveryStatus: 'read',
            timestamp: new Date()
        });
        await conversation.save();

        res.json({ success: true, message: 'Conversation closed successfully', data: conversation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Initialize a fresh or explicit chat conversation session
// @route   POST /api/chat/init
// @access  Public
const initChatSession = async (req, res) => {
    try {
        let { sessionId } = req.body;
        if (!sessionId) {
            sessionId = 'wa_chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        }

        let conversation = await ChatConversation.findOne({ sessionId });
        if (!conversation) {
            const welcomePrompt = getWelcomeAndNamePrompt();
            try {
                conversation = await ChatConversation.create({
                    sessionId,
                    mode: 'HYBRID',
                    leadCaptureStage: 'NAME',
                    messages: [{
                        sender: 'AI',
                        message: welcomePrompt.message,
                        messageType: 'text',
                        options: welcomePrompt.options,
                        actionChips: welcomePrompt.actionChips,
                        deliveryStatus: 'read',
                        timestamp: new Date()
                    }],
                    answers: {}
                });
            } catch (err) {
                if (err.code === 11000) {
                    conversation = await ChatConversation.findOne({ sessionId });
                } else {
                    throw err;
                }
            }

            return res.json({
                success: true,
                isNew: true,
                sessionId,
                stage: 'NAME',
                stepIndex: 0,
                botResponse: welcomePrompt.message,
                options: welcomePrompt.options,
                actionChips: welcomePrompt.actionChips,
                messages: conversation ? conversation.messages : []
            });
        }

        // If existing conversation session is explicitly requested
        res.json({
            success: true,
            isNew: false,
            sessionId,
            stage: conversation.leadCaptureStage || 'NAME',
            mode: conversation.mode,
            lead: conversation.leadId,
            botResponse: conversation.messages[conversation.messages.length - 1]?.message || null,
            messages: conversation.messages
        });
    } catch (error) {
        console.error('[initChatSession] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all chat conversations for CRM history & Admin Inbox
// @route   GET /api/chat/history
// @access  Public / Private
const getConversationsHistory = async (req, res) => {
    try {
        const conversations = await ChatConversation.find()
            .populate('leadId', 'fullName phone email serviceType preferredCountry countryInterest leadScore leadTemperature status followUpStatus lastFollowUpAt visaCategory qualification cgpa intake')
            .populate('assignedCounselor', 'name email phone')
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .limit(100);

        res.json({ success: true, count: conversations.length, data: conversations });
    } catch (error) {
        console.error('[getConversationsHistory] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all immigration services metadata
// @route   GET /api/chat/services
// @access  Public
const getServices = async (req, res) => {
    res.json({ success: true, data: IMMIGRATION_SERVICES });
};

module.exports = {
    handleChatMessage,
    initChatSession,
    getChatSession,
    getConversationsHistory,
    takeoverChat,
    resumeAi,
    sendCounselorReply,
    assignCounselorToChat,
    addChatNote,
    closeConversation,
    getServices
};
