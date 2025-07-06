const { getOnlineUsers, findUserByEmail } = require('../models/userModel');

const getOnlineUsersController = async (req, res) => {
  try {
    const results = await getOnlineUsers();
    res.status(200).json(results);
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserByEmailController = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }
    
    const results = await findUserByEmail(email);
    if (!results.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(results[0]);
  } catch (error) {
    console.error('Error getting user by email:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getOnlineUsersController, getUserByEmailController }; 