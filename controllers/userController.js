const { getOnlineUsers, findUserByEmail } = require('../models/userModel');

const getOnlineUsersController = (req, res) => {
  getOnlineUsers((err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.status(200).json(results);
  });
};

const getUserByEmailController = (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email required' });
  findUserByEmail(email, (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!results.length) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(results[0]);
  });
};

module.exports = { getOnlineUsersController, getUserByEmailController }; 