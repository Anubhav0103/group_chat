const { addMessage, getAllMessages, getMessagesAfter } = require('../models/messageModel');
const { getGroupMembers } = require('../models/groupModel');
const { findUserById } = require('../models/userModel');

const storeMessage = async (req, res) => {
  try {
    const { userId, groupId, message } = req.body;
    
    if (!userId || !groupId || !message) {
      return res.status(400).json({ message: 'userId, groupId, and message are required' });
    }
    
    // Check if user is a member of the group
    const members = await getGroupMembers(groupId);
    
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: 'Not a group member' });
    }
    
    const result = await addMessage(userId, groupId, message);
    
    // Emit new message to all users in the group
    const io = req.app.get('io');
    if (io) {
      // Get user name for the message
      const userResults = await findUserById(userId);
      if (userResults && userResults.length > 0) {
        const user = userResults[0];
        io.to(`group_${groupId}`).emit('new-message', {
          groupId: groupId,
          message: message,
          userId: userId,
          senderName: user.name,
          timestamp: new Date()
        });
      }
    }
    
    res.status(201).json({ message: 'Message stored successfully' });
  } catch (error) {
    // Only keep essential error handling
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllMessagesController = async (req, res) => {
  try {
    const { after, groupId } = req.query;
    
    if (!groupId) {
      return res.status(400).json({ message: 'groupId is required' });
    }
    
    // Only allow group members to fetch messages
    const userId = req.query.userId ? Number(req.query.userId) : null;
    if (userId) {
      const members = await getGroupMembers(groupId);
      if (!members.some(m => m.id === userId)) {
        return res.status(403).json({ message: 'Not a group member' });
      }
    }
    
    let results;
    if (after) {
      results = await getMessagesAfter(groupId, after);
    } else {
      results = await getAllMessages(groupId);
    }
    
    res.status(200).json(results);
  } catch (error) {
    // Only keep essential error handling
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { storeMessage, getAllMessagesController }; 