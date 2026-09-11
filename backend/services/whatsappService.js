/**
 * Meta WhatsApp Cloud API Service
 * Handles incoming webhooks, message formatting, and outgoing message delivery
 */

/**
 * Verify Webhook Challenge for Meta WhatsApp Cloud API
 */
function verifyWebhook(query, configuredToken) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === configuredToken) {
        return { isValid: true, challenge };
    }
    return { isValid: false, challenge: null };
}

/**
 * Extract Message from WhatsApp Webhook Payload
 */
function parseIncomingMessage(body) {
    try {
        const entry = body.entry && body.entry[0];
        const change = entry && entry.changes && entry.changes[0];
        const value = change && change.value;

        if (!value || !value.messages || value.messages.length === 0) {
            return null;
        }

        const message = value.messages[0];
        const contact = value.contacts && value.contacts[0];

        let messageText = '';
        let messageType = message.type || 'text';

        if (message.type === 'text') {
            messageText = message.text ? message.text.body : '';
        } else if (message.type === 'button') {
            messageText = message.button ? message.button.text : '';
        } else if (message.type === 'interactive') {
            if (message.interactive.type === 'button_reply') {
                messageText = message.interactive.button_reply.id || message.interactive.button_reply.title;
            } else if (message.interactive.type === 'list_reply') {
                messageText = message.interactive.list_reply.id || message.interactive.list_reply.title;
            }
        } else if (message.type === 'audio') {
            messageText = '[Voice Message]';
        }

        return {
            fromPhone: message.from,
            userName: contact ? contact.profile?.name : 'WhatsApp User',
            messageId: message.id,
            timestamp: message.timestamp ? new Date(parseInt(message.timestamp, 10) * 1000) : new Date(),
            text: messageText,
            rawType: messageType
        };
    } catch (error) {
        console.error('[WhatsAppService] Error parsing incoming webhook:', error.message);
        return null;
    }
}

/**
 * Send Outgoing Text Message via WhatsApp Cloud API
 */
async function sendPayload(toPhone, payload) {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken || phoneNumberId === 'demo_phone') {
        console.log(`[WhatsAppService (Simulation)] Outgoing ${payload.type} message`);
        return { success: true, simulated: true, to: toPhone };
    }

    try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: toPhone,
                ...payload
            })
        });

        const data = await response.json();
        if (!response.ok) console.error('[WhatsAppService] Delivery rejected:', data.error?.code, data.error?.type);
        return { success: response.ok, data };
    } catch (error) {
        console.error('[WhatsAppService] Error sending text message:', error.message);
        return { success: false, error: error.message };
    }
}

function formatWhatsAppText(text) {
    return String(text).replace(/\*\*(.*?)\*\*/g, '*$1*');
}

function sendTextMessage(toPhone, textBody) {
    return sendPayload(toPhone, { type: 'text', text: { preview_url: false, body: formatWhatsAppText(textBody) } });
}

function buildChoiceMessage(body, options, { header = 'Nestway Immigration', footer = 'Select an option to continue', button = 'View options', navigation = true } = {}) {
    if (navigation && !options.some(option => option.value === 'NAV_MENU')) {
        options = [...options, { label: 'Back to menu', value: 'NAV_MENU' }];
    }
    const clean = text => String(text).replace(/[^\p{L}\p{N}\p{P}\p{Zs}]/gu, '').trim();
    const shorten = (text, max) => text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…';
    const rows = options.map(option => ({
        id: String(option.value),
        title: shorten(clean(option.title || option.label), 24),
        description: shorten(clean(option.description || option.label), 72)
    }));
    if (!rows.length || rows.length > 10) throw new Error('WhatsApp choices must contain 1 to 10 options');
    const buttons = rows.length <= 3 && rows.every(row => row.title.length <= 20 && row.description === row.title);
    return {
        type: 'interactive',
        interactive: {
            type: buttons ? 'button' : 'list',
            header: { type: 'text', text: header },
            body: { text: formatWhatsAppText(body) },
            footer: { text: footer },
            action: buttons
                ? { buttons: rows.map(row => ({ type: 'reply', reply: { id: row.id, title: row.title } })) }
                : { button, sections: [{ title: 'Your options', rows }] }
        }
    };
}

function sendChoiceMessage(toPhone, body, options, settings) {
    return sendPayload(toPhone, buildChoiceMessage(body, options, settings));
}

module.exports = {
    verifyWebhook,
    parseIncomingMessage,
    sendTextMessage,
    sendChoiceMessage,
    buildChoiceMessage,
    formatWhatsAppText
};
