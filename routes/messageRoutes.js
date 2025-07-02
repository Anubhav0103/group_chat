const express = require('express');
const router = express.Router();
const { storeMessage, getAllMessagesController } = require('../controllers/messageController');

router.post('/messages', storeMessage);
router.get('/messages', getAllMessagesController);

module.exports = router; 