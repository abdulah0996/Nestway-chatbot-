const { verifyWebhook, parseIncomingMessage, sendTextMessage, sendChoiceMessage } = require('../services/whatsappService');
const crypto = require('crypto');
const ChatConversation = require('../models/ChatConversation');
const Lead = require('../models/Lead');
const {
    IMMIGRATION_SERVICES,
    getServiceSelectionPrompt,
    getQuestion,
    getTotalQuestions
} = require('../services/qualificationService');
const { calculateLeadScore } = require('../services/leadScoringService');
const { assignCounselorToLead } = require('../services/counselorAssignmentService');
const { scheduleFollowUpSequence } = require('../services/followUpService');
const { handleNavigation } = require('../services/whatsappNavigationService');

const completionOptions = [
    { label: 'Book appointment', value: 'NAV_BOOK' },
    { label: 'Talk to counselor', value: 'NEXT_COUNSELOR' },
    { label: 'Back to menu', value: 'NAV_MENU' }
];

async function sendCompletionMenu(phone, conversation, message = '✅ Your enquiry is saved. What would you like to do next?') {
    await sendChoiceMessage(phone, message, completionOptions);
    conversation.messages.push({ sender: 'AI', message, messageType: 'quick_reply', options: completionOptions, timestamp: new Date() });
    await conversation.save();
}

function questionBody(service, index) {
    return `*${IMMIGRATION_SERVICES[service].name}*\n\n${getQuestion(service, index).text.split('\n\n').pop()}`;
}

function sendQuestion(phone, service, index) {
    const options = getQuestion(service, index).options.map((option, i) => ({
        ...option, value: `q:${service}:${index}:${i}`
    }));
    return sendChoiceMessage(phone, questionBody(service, index), options, {
        footer: `Question ${index + 1} of ${getTotalQuestions(service)}`, button: 'Choose an answer'
    });
}

// Helper to detect initial greetings
const isGreetingText = (txt) => {
    if (!txt) return true;
    const clean = String(txt).trim().toLowerCase();
    return ['hi', 'hello', 'hey', 'start', 'salam', 'assalam o alaikum', 'aoa', 'hola', 'good morning', 'good afternoon', 'good evening', 'help', 'menu', 'reset'].includes(clean);
};

// @desc    Verify Meta WhatsApp Webhook challenge
// @route   GET /api/whatsapp/webhook
// @access  Public
const verifyWebhookChallenge = (req, res) => {
    const configuredToken = process.env.META_VERIFY_TOKEN;
    if (!configuredToken) {
        return res.status(503).send('WhatsApp webhook verification is not configured');
    }
    const result = verifyWebhook(req.query, configuredToken);

    if (result.isValid) {
        console.log('[WhatsApp Webhook] Verification successful');
        return res.status(200).send(result.challenge);
    }
    console.warn('[WhatsApp Webhook] Verification token mismatch');
    return res.status(403).send('Verification token mismatch');
};

// @desc    Receive incoming WhatsApp message webhook
// @route   POST /api/whatsapp/webhook
// @access  Public
const handleIncomingWebhook = async (req, res) => {
    const appSecret = process.env.META_APP_SECRET;
    const suppliedSignature = req.get('x-hub-signature-256') || '';
    const expectedSignature = appSecret && req.rawBody
        ? `sha256=${crypto.createHmac('sha256', appSecret).update(req.rawBody).digest('hex')}`
        : '';
    const validSignature = Boolean(
        expectedSignature &&
        suppliedSignature.length === expectedSignature.length &&
        crypto.timingSafeEqual(Buffer.from(suppliedSignature), Buffer.from(expectedSignature))
    );

    if (!validSignature) {
        console.warn('[WhatsApp Webhook] Rejected event with an invalid signature');
        return res.status(appSecret ? 401 : 503).send('Invalid webhook signature');
    }

    // Immediately acknowledge Meta server
    res.status(200).send('EVENT_RECEIVED');

    try {
        const incoming = parseIncomingMessage(req.body);
        if (!incoming || !incoming.fromPhone || !incoming.text) {
            return;
        }

        const sessionId = `wa_${incoming.fromPhone}`;
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

        conversation.answers = conversation.answers || {};
        if (!conversation.leadCaptureStage) {
            conversation.leadCaptureStage = conversation.serviceType ? 'QUALIFICATION' : 'NAME';
        }

        // Store user incoming message
        conversation.messages.push({
            sender: 'USER',
            message: incoming.text,
            messageType: 'text',
            deliveryStatus: 'read',
            timestamp: incoming.timestamp || new Date()
        });
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const navigation = await handleNavigation(incoming.fromPhone, conversation, String(incoming.text).trim());
        if (navigation === 'RESUME') {
            if (conversation.leadCaptureStage === 'COMPLETED') {
                await sendCompletionMenu(incoming.fromPhone, conversation);
            } else if (conversation.leadCaptureStage === 'QUALIFICATION') {
                await sendQuestion(incoming.fromPhone, conversation.serviceType, conversation.currentQuestionIndex || 0);
            } else if (conversation.leadCaptureStage === 'SERVICE') {
                await sendChoiceMessage(incoming.fromPhone, '🌍 Choose the service you would like help with.', getServiceSelectionPrompt().options, { button: 'Explore services' });
            } else if (conversation.leadCaptureStage === 'EMAIL') {
                await sendChoiceMessage(incoming.fromPhone, 'What email address would you like us to use? This is optional.', [{ label: 'Skip for now', value: 'SKIP' }]);
            } else {
                await sendChoiceMessage(incoming.fromPhone, 'What is your full name?', []);
            }
            return;
        }
        if (navigation) return;

        // If Human Counselor has taken over, do not auto-reply
        if (conversation.mode === 'HUMAN' || conversation.automationPaused) {
            console.log(`[WhatsApp Webhook] ${incoming.fromPhone} is in HUMAN mode. Automated reply suppressed.`);
            return;
        }

        const userText = String(incoming.text).trim();
        let stage = conversation.leadCaptureStage || 'NAME';
        let answers = conversation.answers || {};

        // Old BOOK/DOCS prompts recover into the same working menu as new enquiries.
        // Handle completion before qualification so old sessions cannot get stuck on a question.
        if (stage === 'COMPLETED') {
            if (userText === 'NEXT_COUNSELOR') {
                conversation.mode = 'HUMAN';
                conversation.status = 'WAITING_HUMAN';
                conversation.automationPaused = true;
                const message = '🤝 Your request is saved for a counselor. You can leave a message here; our team will review it. No appointment has been booked yet.';
                conversation.messages.push({ sender: 'AI', message, messageType: 'text', timestamp: new Date() });
                await conversation.save();
                await sendTextMessage(incoming.fromPhone, message);
            } else if (userText === 'NEXT_DONE') {
                await sendCompletionMenu(incoming.fromPhone, conversation, 'Thank you for contacting Nestway Immigration. Your enquiry is saved. You can request a counselor whenever you’re ready.');
            } else {
                await sendCompletionMenu(incoming.fromPhone, conversation);
            }
            return;
        }

        // STEP 1 & 2: Ask Full Name
        if (stage === 'NAME') {
            const isFirstTouch = isGreetingText(userText) || conversation.messages.length <= 1;

            if (isFirstTouch && !conversation.answers.fullName) {
                const welcomePrompt = { message: '🌍 *Welcome to Nestway Immigration*\n\nI’m your virtual assistant. A few short questions will help our team understand your plans.\n\nWhat is your full name?' };
                await sendChoiceMessage(incoming.fromPhone, welcomePrompt.message, []);
                conversation.messages.push({
                    sender: 'AI',
                    message: welcomePrompt.message,
                    messageType: 'text',
                    timestamp: new Date()
                });
                await conversation.save();
                return;
            }

            // User provided name! Save fullName and auto-capture WhatsApp phone
            answers.fullName = userText;
            answers.phone = incoming.fromPhone;
            conversation.answers = answers;
            conversation.markModified('answers');

            // Save Lead to MongoDB
            let lead = await Lead.findOne({ phone: incoming.fromPhone });
            if (!lead) {
                lead = await Lead.create({
                    fullName: answers.fullName,
                    phone: incoming.fromPhone,
                    source: 'WhatsApp',
                    status: 'QUALIFYING',
                    conversationId: conversation._id
                });
            } else {
                lead.fullName = answers.fullName;
                lead.conversationId = conversation._id;
                await lead.save();
            }
            conversation.leadId = lead._id;

            // Advance to Step 4: Ask email (optional)
            conversation.leadCaptureStage = 'EMAIL';
            const waEmailMsg = `Thank you, ${answers.fullName}. 👋\n\nWhat email address would you like us to use? This is optional.`;

            await sendChoiceMessage(incoming.fromPhone, waEmailMsg, [{ label: 'Skip for now', value: 'SKIP' }], { footer: 'Type your email or tap below' });
            conversation.messages.push({
                sender: 'AI',
                message: waEmailMsg,
                messageType: 'quick_reply',
                timestamp: new Date()
            });
            await conversation.save();
            return;
        }

        // STEP 4: Ask Email (Optional)
        if (stage === 'EMAIL') {
            const upperInput = userText.toUpperCase();
            const isSkip = upperInput === 'SKIP' || upperInput.includes('SKIP') || upperInput === 'NO' || upperInput === 'NONE';

            answers.email = isSkip ? '' : userText;
            conversation.answers = answers;
            conversation.markModified('answers');

            if (conversation.leadId) {
                await Lead.findByIdAndUpdate(conversation.leadId, { email: answers.email });
            }

            // Advance to Step 5: Ask immigration service
            conversation.leadCaptureStage = 'SERVICE';
            const servicePrompt = getServiceSelectionPrompt(answers.fullName);
            const waServiceMsg = '🌍 How can we help you?\n\nChoose a service to begin your personalised enquiry.';

            await sendChoiceMessage(incoming.fromPhone, waServiceMsg, servicePrompt.options, { button: 'Explore services' });
            conversation.messages.push({
                sender: 'AI',
                message: waServiceMsg,
                messageType: 'quick_reply',
                timestamp: new Date()
            });
            await conversation.save();
            return;
        }

        // STEP 5: Service Selection
        if (stage === 'SERVICE') {
            let selectedService = null;
            const upper = userText.toUpperCase();

            if (upper.includes('1') || upper.includes('STUDY') || upper.includes('STUDENT')) selectedService = 'STUDY_VISA';
            else if (upper.includes('2') || upper.includes('SKILLED') || upper.includes('WORK') || upper.includes('PR')) selectedService = 'SKILLED_VISA';
            else if (upper.includes('3') || upper.includes('BUSINESS') || upper.includes('INVESTOR')) selectedService = 'BUSINESS_VISA';
            else if (upper.includes('4') || upper.includes('VISIT') || upper.includes('TOURIST')) selectedService = 'VISIT_VISA';

            if (!selectedService) {
                await sendChoiceMessage(incoming.fromPhone, 'Choose the service you would like help with.', getServiceSelectionPrompt().options, { button: 'Explore services' });
                return;
            }

            conversation.serviceType = selectedService;
            conversation.leadCaptureStage = 'QUALIFICATION';
            conversation.currentQuestionIndex = 0;

            if (conversation.leadId) {
                await Lead.findByIdAndUpdate(conversation.leadId, {
                    serviceType: selectedService,
                    visaCategory: IMMIGRATION_SERVICES[selectedService].name
                });
            }

            const q0Msg = questionBody(selectedService, 0);

            await sendQuestion(incoming.fromPhone, selectedService, 0);
            conversation.messages.push({
                sender: 'AI',
                message: q0Msg,
                messageType: 'quick_reply',
                timestamp: new Date()
            });
            await conversation.save();
            return;
        }

        // STEP 6: Dynamic Qualification Questions
        const serviceType = conversation.serviceType || 'STUDY_VISA';
        const currentIdx = conversation.currentQuestionIndex || 0;
        const currentQ = getQuestion(serviceType, currentIdx);

        if (currentQ) {
            conversation.answers = conversation.answers || {};
            const selected = currentQ.options.find((option, i) =>
                userText === `q:${serviceType}:${currentIdx}:${i}` || userText === String(i + 1) ||
                userText.toLowerCase() === String(option.value).toLowerCase() || userText.toLowerCase() === option.label.toLowerCase());
            if (!selected) {
                await sendQuestion(incoming.fromPhone, serviceType, currentIdx);
                return;
            }
            conversation.answers[currentQ.field] = selected.value;
            conversation.markModified('answers');
            conversation.currentQuestionIndex = currentIdx + 1;
        }

        const nextIdx = conversation.currentQuestionIndex || 0;
        const totalQ = getTotalQuestions(serviceType);

        if (nextIdx < totalQ) {
            const questionText = questionBody(serviceType, nextIdx);

            await sendQuestion(incoming.fromPhone, serviceType, nextIdx);
            conversation.messages.push({
                sender: 'AI',
                message: questionText,
                messageType: 'quick_reply',
                timestamp: new Date()
            });
            await conversation.save();
            return;
        }

        // Finished questions: score and update Lead model!
        conversation.leadCaptureStage = 'COMPLETED';
        const score = calculateLeadScore(serviceType, conversation.answers);
        const assignedCounselor = await assignCounselorToLead({
            serviceType,
            preferredCountry: conversation.answers.preferredCountry || 'UK'
        });

        let lead = await Lead.findOne({ phone: incoming.fromPhone });
        if (lead) {
            lead.serviceType = serviceType;
            lead.qualificationData = conversation.answers;
            lead.markModified('qualificationData');
            lead.leadScore = score.totalScore;
            lead.leadTemperature = score.temperature;
            lead.scoreReasons = score.scoreReasons;
            lead.status = 'QUALIFIED';
            if (assignedCounselor) lead.assignedCounselor = assignedCounselor.counselorId;
            lead.conversationId = conversation._id;
            await lead.save();
        }

        conversation.leadId = lead ? lead._id : null;
        if (assignedCounselor) conversation.assignedCounselor = assignedCounselor.counselorId;

        if (lead) await scheduleFollowUpSequence(lead, conversation._id);

        const destination = conversation.answers.preferredCountry || conversation.answers.destinationCountry || 'To be discussed';
        const summaryMsg = `✅ *Your enquiry is ready*\n\nThank you, ${lead ? lead.fullName : 'there'}.\n\n` +
            `*Service:* ${IMMIGRATION_SERVICES[serviceType].name}\n` +
            `*Destination:* ${destination}\n` +
            `*Counselor:* ${assignedCounselor ? assignedCounselor.name : 'Nestway team'}\n\n` +
            'Your details have been saved for our team to review.\n\nVisa decisions are made by immigration authorities. This enquiry is not an approval or eligibility guarantee.';

        await sendCompletionMenu(incoming.fromPhone, conversation, summaryMsg);
    } catch (error) {
        console.error('[WhatsApp Webhook] Handler error:', error);
    }
};

module.exports = {
    verifyWebhookChallenge,
    handleIncomingWebhook
};

