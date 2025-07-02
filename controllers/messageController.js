const { addMessage } = require('../models/messageModel');

const storeMessage = (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message) {
    return res.status(400).json({ message: 'userId and message are required' });
  }
  addMessage(userId, message, (err, result) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.status(201).json({ message: 'Message stored successfully' });
  });
};

module.exports = { storeMessage }; 