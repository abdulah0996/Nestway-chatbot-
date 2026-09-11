const assert = require('node:assert/strict');
const service = require('./services/whatsappService');
const controllers = require('./controllers/meetingController');
const Conversation = require('./models/ChatConversation');
const Meeting = require('./models/Meeting');
const Counselor = require('./models/Counselor');
let sent = [], current, booked = [], occupied = false, existing = null;
service.sendChoiceMessage = async (phone, body, options, settings) => {
    const payload = service.buildChoiceMessage(body, options, settings);
    sent.push({ body, options, payload });
    return { success: true };
};
Meeting.findOne = async () => existing;
Counselor.findOne = async () => ({ _id: 'counselor', name: 'Test Counselor' });
controllers.getAvailableSlots = async (req, res) => res.json({ success: true, slots: [{ time: '09:00 AM', available: !occupied }, { time: '10:00 AM', available: true }] });
controllers.bookMeeting = async (req, res) => {
    booked.push(req.body);
    if (occupied) return res.status(409).json({ success: false });
    res.status(201).json({ success: true, data: { date: req.body.date, time: req.body.time } });
};
Conversation.findOneAndUpdate = async (query) => {
    if (current.whatsappFlow.step !== 'CONFIRM' || current.whatsappFlow.token !== query['whatsappFlow.token']) return null;
    // Return a separate persisted representation, as mongoose does.
    current = { ...current, whatsappFlow: { ...current.whatsappFlow, step: 'SUBMITTING' } };
    return current;
};
Conversation.findById = async () => current;
const { handleNavigation, bookingDates } = require('./services/whatsappNavigationService');
function reset() {
    sent = []; booked = []; occupied = false; existing = null;
    current = { _id: 'conversation', sessionId: 'wa_test', leadId: 'lead', answers: { fullName: 'Test User' }, leadCaptureStage: 'QUALIFICATION', currentQuestionIndex: 3, mode: 'HYBRID', messages: [], save: async () => {}, markModified() {} };
}
const receive = input => handleNavigation('test', current, input);
async function toConfirm() {
    await receive('NAV_BOOK');
    await receive('BOOK_ONLINE');
    await receive(sent.at(-1).options[0].value);
    await receive(sent.at(-1).options[0].value);
    return sent.at(-1).options[0].value;
}
async function main() {
    assert.equal(bookingDates(new Date('2026-09-11T23:00:00Z'))[0], '2026-09-13');
    reset();
    await receive('NAV_MENU');
    assert.equal(await receive('NAV_RESUME'), 'RESUME');
    assert.equal(current.currentQuestionIndex, 3);
    assert.equal(current.answers.fullName, 'Test User');
    reset();
    const confirmation = await toConfirm();
    assert.match(sent.at(-1).body, /Review your appointment/);
    assert.equal(booked.length, 0, 'Review must not create an appointment');
    await receive(confirmation);
    assert.equal(booked.length, 1);
    assert.equal(booked[0].consultationType, 'ONLINE');
    assert.equal(booked[0].sessionId, 'wa_test');
    assert.match(sent.at(-1).body, /Pending confirmation/);
    await receive(confirmation);
    assert.equal(booked.length, 1, 'Repeated confirmation cannot book twice');
    reset();
    const abandoned = await toConfirm();
    await receive('NAV_MENU');
    await receive(abandoned);
    assert.equal(booked.length, 0);
    assert.equal(current.currentQuestionIndex, 3);
    reset();
    const collision = await toConfirm();
    occupied = true;
    await receive(collision);
    assert.match(sent.at(-1).body, /just taken/);
    assert.equal(sent.at(-1).options.length, 1);
    reset();
    current.mode = 'HUMAN'; current.automationPaused = true;
    assert.equal(await receive('Hello'), false);
    await receive('NAV_MENU');
    assert.equal(current.mode, 'HYBRID');
    assert.equal(current.automationPaused, false);
    reset();
    existing = { date: '2026-09-15', time: '09:00 AM', status: 'PENDING' };
    await receive('NAV_BOOK');
    assert.match(sent.at(-1).body, /already have/);
    assert.equal(booked.length, 0);
    reset();
    delete current.answers.fullName;
    await receive('NAV_BOOK');
    assert.equal(current.whatsappFlow.step, 'NAME');
    await receive('Test Applicant');
    assert.equal(current.whatsappFlow.step, 'TYPE');
    await receive('BOOK_IN_PERSON');
    assert.equal(current.whatsappFlow.type, 'IN_PERSON');
    console.log('WhatsApp booking checks passed: menu/resume, name, modes, date/time/review, pending booking, duplicate confirmation, abandoned flow, slot collision, existing appointment, human handoff, timezone.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
