const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');

router.post('/api/signup', signup);
router.post('/api/login', login);

module.exports = router; 