const express = require('express');
const router = express.Router();
const { getOnlineUsersController, getUserByEmailController } = require('../controllers/userController');

router.get('/online-users', getOnlineUsersController);
router.get('/users/by-email', getUserByEmailController);

module.exports = router; 