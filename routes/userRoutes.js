const express = require('express');
const router = express.Router();
const { getOnlineUsersController } = require('../controllers/userController');

router.get('/online-users', getOnlineUsersController);

module.exports = router; 