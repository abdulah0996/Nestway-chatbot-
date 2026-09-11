const FollowUp = require('../models/FollowUp');
const Lead = require('../models/Lead');
const ChatConversation = require('../models/ChatConversation');

/**
 * Intelligent Follow-Up Engine
 * Automates 24-hour, 3-day, and 7-day re-engagement campaigns
 * Enforces strict pre-send validation to prevent duplicate or unwanted messages
 */

/**
 * Schedule automated follow-up sequence for a lead
 */
async function scheduleFollowUpSequence(lead, conversationId = null) {
    try {
        const now = new Date();

        // 1. Follow-up 1: 24 Hours later
        const time24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        await FollowUp.create({
            leadId: lead._id,
            conversationId,
            attemptNumber: 1,
            type: 'NO_RESPONSE_24H',
            channel: 'WHATSAPP',
            status: 'SCHEDULED',
            scheduledAt: time24h,
            message: `Hi ${lead.fullName || 'there'}, this is your AI Immigration Advisor. We noticed you checked eligibility for ${lead.preferredCountry || lead.countryInterest || 'your visa'}. Would you like to view top options or book a consultation with our counselor?`
        });

        // 2. Follow-up 2: 3 Days later
        const time3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        await FollowUp.create({
            leadId: lead._id,
            conversationId,
            attemptNumber: 2,
            type: 'REMINDER_3D',
            channel: 'WHATSAPP',
            status: 'SCHEDULED',
            scheduledAt: time3d,
            message: `Hello ${lead.fullName || ''}! University admissions and quota deadlines for ${lead.preferredCountry || 'your target destination'} are currently active. Reply 'YES' to review document checklists.`
        });

        // 3. Follow-up 3: 7 Days later
        const time7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await FollowUp.create({
            leadId: lead._id,
            conversationId,
            attemptNumber: 3,
            type: 'NURTURE_7D',
            channel: 'WHATSAPP',
            status: 'SCHEDULED',
            scheduledAt: time7d,
            message: `Hi ${lead.fullName || ''}, we have limited consultation slots available this week for ${lead.preferredCountry || 'visa consultations'}. Let us know if we can reserve a slot for you.`
        });

        // Update lead with next follow-up date
        await Lead.findByIdAndUpdate(lead._id, { nextFollowUpAt: time24h });

        return true;
    } catch (error) {
        console.error('[FollowUpService] Error scheduling sequence:', error.message);
        return false;
    }
}

/**
 * Pre-Send Validation Guard
 * Verifies 5 key conditions before sending any automated message:
 * 1. Did user already reply?
 * 2. Is counselor actively handling conversation (HUMAN mode)?
 * 3. Is lead already converted or consultation completed?
 * 4. Is automation paused?
 * 5. Was duplicate message already sent recently?
 */
async function validateFollowUpCanSend(followUp) {
    const lead = await Lead.findById(followUp.leadId);
    if (!lead) {
        return { canSend: false, reason: 'Lead record no longer exists' };
    }

    // Check 1: Is lead already converted or finished consultation?
    if (['CONVERTED', 'CONSULTATION_COMPLETED', 'LOST'].includes(lead.status)) {
        return { canSend: false, reason: `Lead status is ${lead.status}` };
    }

    // Check 2: Check Conversation state
    if (followUp.conversationId) {
        const conversation = await ChatConversation.findById(followUp.conversationId);
        if (conversation) {
            // Check automation pause
            if (conversation.automationPaused) {
                return { canSend: false, reason: 'Conversation automation is explicitly paused' };
            }

            // Check human mode
            if (conversation.mode === 'HUMAN') {
                return { canSend: false, reason: 'Human counselor has taken over conversation' };
            }

            // Check if user replied after this follow-up was scheduled
            const scheduledTime = new Date(followUp.scheduledAt).getTime();
            const hasRecentUserReply = conversation.messages.some(m =>
                (m.sender === 'USER' || m.sender === 'user') &&
                new Date(m.timestamp).getTime() > (scheduledTime - 24 * 60 * 60 * 1000)
            );
            if (hasRecentUserReply) {
                return { canSend: false, reason: 'User engaged and replied in conversation' };
            }
        }
    }

    // Check 3: Prevent duplicate messages sent in last 12 hours
    const duplicate = await FollowUp.findOne({
        leadId: followUp.leadId,
        message: followUp.message,
        status: 'SENT',
        sentAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
    });
    if (duplicate) {
        return { canSend: false, reason: 'Duplicate message already sent within 12 hours' };
    }

    return { canSend: true };
}

/**
 * Process all due follow-ups
 */
async function processDueFollowUps() {
    const now = new Date();
    const dueFollowUps = await FollowUp.find({
        status: 'SCHEDULED',
        scheduledAt: { $lte: now }
    }).limit(25);

    const results = { sent: 0, cancelled: 0 };

    for (const item of dueFollowUps) {
        const check = await validateFollowUpCanSend(item);

        if (!check.canSend) {
            item.status = 'CANCELLED';
            item.cancelledReason = check.reason;
            await item.save();
            results.cancelled++;
        } else {
            // Mark as sent
            item.status = 'SENT';
            item.sentAt = new Date();
            await item.save();

            // Append message to conversation if exists
            if (item.conversationId) {
                await ChatConversation.findByIdAndUpdate(item.conversationId, {
                    $push: {
                        messages: {
                            sender: 'AI',
                            message: item.message,
                            messageType: 'text',
                            deliveryStatus: 'delivered',
                            timestamp: new Date()
                        }
                    },
                    lastMessageAt: new Date()
                });
            }

            results.sent++;
        }
    }

    return results;
}

module.exports = {
    scheduleFollowUpSequence,
    validateFollowUpCanSend,
    processDueFollowUps
};
