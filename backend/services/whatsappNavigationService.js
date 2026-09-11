const { randomUUID } = require('node:crypto');
const { sendChoiceMessage } = require('./whatsappService');
const Conversation = require('../models/ChatConversation');
const Meeting = require('../models/Meeting');
const Counselor = require('../models/Counselor');
const User = require('../models/User');
const { getAvailableSlots, bookMeeting } = require('../controllers/meetingController');

// Use the same booking endpoint logic as the website, without an HTTP round trip.
async function callController(controller, request) {
    let result;
    const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { result = { status: this.statusCode, ...body }; } };
    await controller(request, response);
    return result;
}

async function reply(phone, conversation, message, options, settings) {
    conversation.messages.push({ sender: 'AI', message, messageType: 'quick_reply', options, timestamp: new Date() });
    conversation.markModified('whatsappFlow');
    await conversation.save();
    await sendChoiceMessage(phone, message, options, settings);
}

async function showMenu(phone, conversation) {
    conversation.whatsappFlow = { step: 'MENU' };
    // An explicit return to the bot ends the user's counselor handoff.
    conversation.mode = 'HYBRID';
    conversation.automationPaused = false;
    const options = [
        { label: 'Book appointment', value: 'NAV_BOOK' },
        { label: 'Continue enquiry', value: 'NAV_RESUME' },
        { label: 'Talk to counselor', value: 'NAV_COUNSELOR' }
    ];
    await reply(phone, conversation, '🌍 *Nestway Immigration*\n\nHow can we help? Your enquiry progress is saved.', options, { navigation: false });
}

function bookingDates(now = new Date()) {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today + 'T12:00:00+05:00');
        date.setUTCDate(date.getUTCDate() + i + 1);
        return date.toISOString().slice(0, 10);
    });
}

async function dates(phone, conversation, message = '📅 Choose a date for your consultation.\nAll appointment times are Pakistan time (UTC+5).') {
    const flow = conversation.whatsappFlow;
    flow.step = 'DATE';
    flow.dates = bookingDates();
    flow.date = null;
    flow.time = null;
    await reply(phone, conversation, message, flow.dates.map(date => ({
        label: new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Karachi' }).format(new Date(date + 'T12:00:00+05:00')),
        value: `BD:${flow.token}:${date}`
    })), { button: 'Choose date' });
}

async function times(phone, conversation, message) {
    const flow = conversation.whatsappFlow;
    const result = await callController(getAvailableSlots, { query: { date: flow.date, counselorId: flow.counselorId } });
    if (!result?.success) {
        await reply(phone, conversation, 'We couldn’t load availability. Please choose another date or return to the menu.', [{ label: 'Choose date', value: 'NAV_DATES' }]);
        return;
    }
    flow.step = 'TIME';
    flow.times = result.slots.filter(slot => slot.available).map(slot => slot.time);
    if (!flow.times.length) {
        await dates(phone, conversation, 'This date is fully booked. Please choose another date.');
        return;
    }
    await reply(phone, conversation, message || `🕒 Choose a time on *${flow.date}*.\nPakistan time (UTC+5).`, flow.times.map((time, i) => ({ label: time, value: `BT:${flow.token}:${i}` })), { button: 'Choose time' });
}

async function startBooking(phone, conversation) {
    const existing = await Meeting.findOne({ sessionId: conversation.sessionId, status: { $in: ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'Scheduled'] } });
    if (existing) {
        await reply(phone, conversation, `📅 You already have an appointment request.\n\n*Date:* ${existing.date}\n*Time:* ${existing.time} (Pakistan time)\n*Status:* ${existing.status}\n\nContact a counselor to change it.`, [{ label: 'Talk to counselor', value: 'NAV_COUNSELOR' }]);
        return;
    }
    const counselor = await Counselor.findOne({ active: true }) || await User.findOne({ role: 'COUNSELOR', active: true });
    if (!counselor) {
        await reply(phone, conversation, 'Online booking is unavailable right now. A counselor can help arrange your consultation.', [{ label: 'Talk to counselor', value: 'NAV_COUNSELOR' }]);
        return;
    }
    conversation.whatsappFlow = { step: 'TYPE', token: randomUUID(), counselorId: String(counselor.userId || counselor._id) };
    if (!conversation.answers.fullName) {
        conversation.whatsappFlow.step = 'NAME';
        await reply(phone, conversation, 'What is your full name for the appointment?', []);
        return;
    }
    await chooseType(phone, conversation);
}

async function chooseType(phone, conversation) {
    conversation.whatsappFlow.step = 'TYPE';
    await reply(phone, conversation, '📅 How would you like to meet your counselor?', [
        { label: 'Online', value: 'BOOK_ONLINE' }, { label: 'In person', value: 'BOOK_IN_PERSON' }
    ]);
}

async function handleNavigation(phone, conversation, input) {
    if (['NAV_MENU', 'MENU', 'BACK', 'BACK TO MENU'].includes(input.toUpperCase())) {
        await showMenu(phone, conversation);
        return true;
    }
    const flow = conversation.whatsappFlow;
    // A menu remains reachable even during a human handoff, but ordinary messages stay with staff.
    if (conversation.mode === 'HUMAN' || conversation.automationPaused) return false;
    if (['NAV_COUNSELOR', 'NEXT_COUNSELOR'].includes(input)) {
        conversation.whatsappFlow = null;
        conversation.mode = 'HUMAN';
        conversation.automationPaused = true;
        conversation.status = 'WAITING_HUMAN';
        await reply(phone, conversation, '🤝 Your request is saved for a counselor. Leave a message here, or tap Back to menu to return to the assistant.', []);
        return true;
    }
    if (['NAV_BOOK', 'BOOK'].includes(input.toUpperCase())) {
        await startBooking(phone, conversation);
        return true;
    }
    if (flow?.step === 'MENU' && input === 'NAV_RESUME') {
        conversation.whatsappFlow = null;
        await conversation.save();
        return 'RESUME';
    }
    if (!flow) return false;
    if (flow.step === 'MENU') { await showMenu(phone, conversation); return true; }
    if (flow.step === 'NAME') {
        if (input.includes(':') || input.startsWith('NAV_') || input.startsWith('BOOK_') || input.length < 2 || input.length > 100) {
            await reply(phone, conversation, 'Please type your full name, or return to the menu.', []);
        } else {
            conversation.answers.fullName = input;
            conversation.answers.phone = phone;
            conversation.markModified('answers');
            await chooseType(phone, conversation);
        }
        return true;
    }
    if (flow.step === 'TYPE' && ['BOOK_ONLINE', 'BOOK_IN_PERSON'].includes(input)) {
        flow.type = input === 'BOOK_ONLINE' ? 'ONLINE' : 'IN_PERSON';
        await dates(phone, conversation);
        return true;
    }
    if (input === 'NAV_DATES' && flow.type) { await dates(phone, conversation); return true; }
    if (flow.step === 'DATE' && input.startsWith(`BD:${flow.token}:`)) {
        const date = input.split(':').pop();
        if (!flow.dates.includes(date) || !bookingDates().includes(date)) { await dates(phone, conversation); return true; }
        flow.date = date;
        await times(phone, conversation);
        return true;
    }
    if (flow.step === 'TIME' && input.startsWith(`BT:${flow.token}:`)) {
        const index = input.split(':').pop();
        if (!/^\d+$/.test(index) || !flow.times[Number(index)]) { await times(phone, conversation); return true; }
        flow.time = flow.times[Number(index)];
        flow.step = 'CONFIRM';
        await reply(phone, conversation, `📅 *Review your appointment request*\n\n*Name:* ${conversation.answers.fullName}\n*Mode:* ${flow.type === 'ONLINE' ? 'Online' : 'In person'}\n*Date:* ${flow.date}\n*Time:* ${flow.time} (Pakistan time)\n\nOur team will confirm the appointment${flow.type === 'IN_PERSON' ? ' and office location' : ''}.`, [
            { label: 'Submit request', value: `BC:${flow.token}` }, { label: 'Change date', value: 'NAV_DATES' }
        ]);
        return true;
    }
    if (flow.step === 'CONFIRM' && input === `BC:${flow.token}`) {
        if (!bookingDates().includes(flow.date)) { await dates(phone, conversation, 'That date has expired. Please choose a new date.'); return true; }
        // Claim this confirmation atomically so double taps and webhook retries cannot submit it twice.
        const claimed = await Conversation.findOneAndUpdate({ _id: conversation._id, 'whatsappFlow.token': flow.token, 'whatsappFlow.step': 'CONFIRM' }, { $set: { 'whatsappFlow.step': 'SUBMITTING' } }, { new: true });
        if (!claimed) return true;
        const result = await callController(bookMeeting, { body: {
            sessionId: conversation.sessionId, leadId: conversation.leadId,
            fullName: conversation.answers.fullName, phone, email: conversation.answers.email || '',
            counselorId: flow.counselorId, date: flow.date, time: flow.time,
            consultationType: flow.type, meetingType: flow.type === 'ONLINE' ? 'Online Consultation' : 'In-Person Consultation',
            serviceType: conversation.serviceType || 'STUDY_VISA',
            countryInterest: conversation.answers.preferredCountry || conversation.answers.destinationCountry,
            notes: 'Requested through WhatsApp; timezone Asia/Karachi.'
        } });
        // Booking updates conversation history and lead references; reload before saving the reply.
        const fresh = await Conversation.findById(conversation._id);
        if (result?.success) {
            fresh.whatsappFlow = null;
            await reply(phone, fresh, `✅ *Appointment request submitted*\n\n*Date:* ${result.data.date}\n*Time:* ${result.data.time} (Pakistan time)\n*Status:* Pending confirmation\n\nOur team will review your request.`, [{ label: 'Talk to counselor', value: 'NAV_COUNSELOR' }]);
        } else {
            fresh.whatsappFlow = { ...flow, step: 'TIME' };
            await times(phone, fresh, result?.status === 409 ? 'That slot was just taken. Please select another time.' : 'We couldn’t submit your request. Please try another slot or contact a counselor.');
        }
        return true;
    }
    if (flow.step === 'SUBMITTING') {
        await reply(phone, conversation, 'Your appointment request is being processed. Please wait a moment.', []);
    } else {
        await reply(phone, conversation, 'That selection is no longer active. Return to the menu to continue.', []);
    }
    return true;
}

module.exports = { handleNavigation, showMenu, bookingDates };
