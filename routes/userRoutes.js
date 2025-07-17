const express = require('express');
const router = express.Router();
const { getOnlineUsersController, getUserByEmailController } = require('../controllers/userController');

router.get('/api/online-users', getOnlineUsersController);
router.get('/api/users/by-email', getUserByEmailController);

module.exports = router; 