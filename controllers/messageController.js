const { addMessage, getAllMessages } = require('../models/messageModel');

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

const getAllMessagesController = (req, res) => {
  getAllMessages((err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.status(200).json(results);
  });
};

module.exports = { storeMessage, getAllMessagesController }; 