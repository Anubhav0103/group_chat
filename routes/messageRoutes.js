const express = require('express');
const router = express.Router();
const { storeMessage, getAllMessagesController } = require('../controllers/messageController');

router.post('/api/messages', storeMessage);
router.get('/api/messages', getAllMessagesController);

module.exports = router; 