const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/chatbotController');

router.post('/init', initChatSession);
router.post('/message', handleChatMessage);
router.post('/counselor/message', sendCounselorReply);
router.get('/session/:sessionId', getChatSession);
router.get('/history', getConversationsHistory);
router.get('/conversations', getConversationsHistory);
router.post('/takeover', takeoverChat);
router.post('/resume-ai', resumeAi);
router.post('/assign', assignCounselorToChat);
router.post('/notes', addChatNote);
router.post('/close', closeConversation);
router.get('/services', getServices);

module.exports = router;
