const { getOnlineUsers } = require('../models/userModel');

const getOnlineUsersController = (req, res) => {
  getOnlineUsers((err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.status(200).json(results);
  });
};

module.exports = { getOnlineUsersController }; 