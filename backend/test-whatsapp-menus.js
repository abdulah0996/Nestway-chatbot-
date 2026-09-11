const assert = require('node:assert/strict');
const { buildChoiceMessage, formatWhatsAppText, parseIncomingMessage, sendChoiceMessage } = require('./services/whatsappService');
const { IMMIGRATION_SERVICES, getServiceSelectionPrompt } = require('./services/qualificationService');

async function main() {
    assert.equal(formatWhatsAppText('Hello **Abdullah**'), 'Hello *Abdullah*');
    const skip = buildChoiceMessage('Email is optional.', [{ label: 'Skip for now', value: 'SKIP' }]);
    assert.equal(skip.interactive.type, 'button');
    assert.equal(skip.interactive.action.buttons[0].reply.id, 'SKIP');
    const menu = buildChoiceMessage('Choose a service.', getServiceSelectionPrompt().options);
    assert.equal(menu.interactive.action.sections[0].rows.length, 5);
    for (const [service, definition] of Object.entries(IMMIGRATION_SERVICES)) {
        definition.questions.forEach((question, index) => {
            const options = question.options.map((o, i) => ({ ...o, value: `q:${service}:${index}:${i}` }));
            const payload = buildChoiceMessage(question.text, options);
            const interactive = payload.interactive;
            assert.ok(interactive.body.text.length <= 1024);
            const choices = interactive.type === 'list' ? interactive.action.sections[0].rows : interactive.action.buttons.map(b => b.reply);
            assert.equal(choices.length, options.length + 1);
            for (const [i, row] of choices.entries()) {
                assert.ok(row.title.length <= (interactive.type === 'list' ? 24 : 20));
                assert.ok(!row.description || row.description.length <= 72);
                const replyType = interactive.type === 'list' ? 'list_reply' : 'button_reply';
                const parsed = parseIncomingMessage({ entry: [{ changes: [{ value: { messages: [{ from: 'test', type: 'interactive', interactive: { type: replyType, [replyType]: { id: row.id, title: row.title } } }] } }] }] });
                assert.equal(parsed.text, i === options.length ? 'NAV_MENU' : `q:${service}:${index}:${i}`);
            }
        });
    }
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone';
    process.env.META_ACCESS_TOKEN = 'test_token';
    global.fetch = async (url, request) => {
        const payload = JSON.parse(request.body);
        assert.equal(payload.type, 'interactive');
        assert.equal(payload.to, 'test_recipient');
        return { ok: true, json: async () => ({ messages: [{ id: 'test' }] }) };
    };
    assert.equal((await sendChoiceMessage('test_recipient', 'Email?', [{ label: 'Skip', value: 'SKIP' }])).success, true);
    console.log('WhatsApp menus passed: all 24 questions, service list, skip button, reply IDs, formatting and mocked delivery.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
