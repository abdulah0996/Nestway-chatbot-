const assert = require('node:assert/strict');
const service = require('./services/whatsappService');
const Conversation = require('./models/ChatConversation');
const sent = [];
service.sendChoiceMessage = async (...args) => { sent.push({ kind: 'choices', args }); return { success: true }; };
service.sendTextMessage = async (...args) => { sent.push({ kind: 'text', args }); return { success: true }; };
const { handleIncomingWebhook } = require('./controllers/whatsappController');
let conversation;
Conversation.findOne = async () => conversation;
function reset() {
    sent.length = 0;
    conversation = { leadCaptureStage: 'COMPLETED', currentQuestionIndex: 0, serviceType: 'STUDY_VISA', mode: 'HYBRID', answers: {}, messages: [], save: async () => {}, markModified: () => {} };
}
async function receive(text) {
    await handleIncomingWebhook({ body: { entry: [{ changes: [{ value: { messages: [{ from: 'test', type: 'text', text: { body: text } }] } }] }] } }, { status() { return this; }, send() {} });
}
async function main() {
    for (const oldInput of ['DOCS', 'Hi']) {
        reset();
        await receive(oldInput);
        assert.equal(sent[0].kind, 'choices');
        assert.deepEqual(sent[0].args[2].map(o => o.value), ['NAV_BOOK', 'NEXT_COUNSELOR', 'NAV_MENU']);
        assert.equal(conversation.currentQuestionIndex, 0);
    }
    reset();
    await receive('NEXT_COUNSELOR');
    assert.equal(conversation.mode, 'HUMAN');
    assert.equal(conversation.status, 'WAITING_HUMAN');
    assert.equal(conversation.automationPaused, true);
    assert.equal(sent[0].kind, 'choices');
    assert.match(sent[0].args[1], /Back to menu/);
    await receive('Hi');
    assert.equal(sent.length, 1, 'Automation must respect the handoff');
    reset();
    await receive('NEXT_DONE');
    assert.equal(sent[0].kind, 'choices');
    assert.equal(conversation.mode, 'HYBRID');
    console.log('Completion regression checks passed: legacy BOOK/DOCS, completed sessions, counselor handoff and Done.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
