const express = require('express');
const router = express.Router();
const { verifyWebhookChallenge, handleIncomingWebhook } = require('../controllers/whatsappController');

// Meta Webhook Verification & Events
router.get('/webhook', verifyWebhookChallenge);
router.post('/webhook', handleIncomingWebhook);

module.exports = router;
