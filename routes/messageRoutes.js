const express = require('express');
const router = express.Router();
const { storeMessage } = require('../controllers/messageController');

router.post('/messages', storeMessage);

module.exports = router; 