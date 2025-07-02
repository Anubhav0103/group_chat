const db = require('../config/db');

const addMessage = (userId, message, callback) => {
  db.query(
    'INSERT INTO messages (user_id, message) VALUES (?, ?)',
    [userId, message],
    callback
  );
};

module.exports = { addMessage }; 