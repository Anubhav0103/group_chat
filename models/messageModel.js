const db = require('../config/db');

const addMessage = (userId, message, callback) => {
  db.query(
    'INSERT INTO messages (user_id, message) VALUES (?, ?)',
    [userId, message],
    callback
  );
};

const getAllMessages = (callback) => {
  db.query(
    `SELECT messages.id, messages.message, messages.created_at, users.name as senderName, users.id as userId
     FROM messages
     JOIN users ON messages.user_id = users.id
     ORDER BY messages.created_at ASC`,
    callback
  );
};

const getMessagesAfter = (timestamp, callback) => {
  db.query(
    `SELECT messages.id, messages.message, messages.created_at, users.name as senderName, users.id as userId
     FROM messages
     JOIN users ON messages.user_id = users.id
     WHERE messages.created_at > ?
     ORDER BY messages.created_at ASC`,
    [timestamp],
    callback
  );
};

module.exports = { addMessage, getAllMessages, getMessagesAfter }; 