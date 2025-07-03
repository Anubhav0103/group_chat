const { addMessage, getAllMessages, getMessagesAfter } = require('../models/messageModel');
const { getGroupMembers } = require('../models/groupModel');

const storeMessage = (req, res) => {
  const { userId, groupId, message } = req.body;
  if (!userId || !groupId || !message) {
    return res.status(400).json({ message: 'userId, groupId, and message are required' });
  }
  // Check if user is a member of the group
  getGroupMembers(groupId, (err, members) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: 'Not a group member' });
    }
    addMessage(userId, groupId, message, (err2) => {
      if (err2) return res.status(500).json({ message: 'Server error' });
      res.status(201).json({ message: 'Message stored successfully' });
    });
  });
};

const getAllMessagesController = (req, res) => {
  const { after, groupId } = req.query;
  if (!groupId) return res.status(400).json({ message: 'groupId is required' });
  // Only allow group members to fetch messages
  const userId = req.query.userId ? Number(req.query.userId) : null;
  if (userId) {
    getGroupMembers(groupId, (err, members) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (!members.some(m => m.id === userId)) {
        return res.status(403).json({ message: 'Not a group member' });
      }
      if (after) {
        getMessagesAfter(groupId, after, (err2, results) => {
          if (err2) return res.status(500).json({ message: 'Server error' });
          res.status(200).json(results);
        });
      } else {
        getAllMessages(groupId, (err2, results) => {
          if (err2) return res.status(500).json({ message: 'Server error' });
          res.status(200).json(results);
        });
      }
    });
  } else {
    // If no userId, just fetch messages (for admin/testing)
    if (after) {
      getMessagesAfter(groupId, after, (err2, results) => {
        if (err2) return res.status(500).json({ message: 'Server error' });
        res.status(200).json(results);
      });
    } else {
      getAllMessages(groupId, (err2, results) => {
        if (err2) return res.status(500).json({ message: 'Server error' });
        res.status(200).json(results);
      });
    }
  }
};

module.exports = { storeMessage, getAllMessagesController }; 