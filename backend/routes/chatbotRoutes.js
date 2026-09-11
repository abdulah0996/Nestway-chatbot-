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
const { protect, restrictTo } = require('../middleware/authMiddleware');

const staffOnly = [protect, restrictTo('ADMIN', 'COUNSELOR')];

router.post('/init', initChatSession);
router.post('/message', handleChatMessage);
router.post('/counselor/message', ...staffOnly, sendCounselorReply);
router.get('/session/:sessionId', getChatSession);
router.get('/history', ...staffOnly, getConversationsHistory);
router.get('/conversations', ...staffOnly, getConversationsHistory);
router.post('/takeover', ...staffOnly, takeoverChat);
router.post('/resume-ai', ...staffOnly, resumeAi);
router.post('/assign', ...staffOnly, assignCounselorToChat);
router.post('/notes', ...staffOnly, addChatNote);
router.post('/close', ...staffOnly, closeConversation);
router.get('/services', getServices);

module.exports = router;
