const db = require('../config/db');

const addMessage = (userId, groupId, message, callback) => {
  db.query(
    'INSERT INTO messages (user_id, group_id, message) VALUES (?, ?, ?)',
    [userId, groupId, message],
    callback
  );
};

const getAllMessages = (groupId, callback) => {
  db.query(
    `SELECT messages.id, messages.message, messages.created_at, users.name as senderName, users.id as userId
     FROM messages
     JOIN users ON messages.user_id = users.id
     WHERE messages.group_id = ?
     ORDER BY messages.created_at ASC`,
    [groupId],
    callback
  );
};

const getMessagesAfter = (groupId, timestamp, callback) => {
  db.query(
    `SELECT messages.id, messages.message, messages.created_at, users.name as senderName, users.id as userId
     FROM messages
     JOIN users ON messages.user_id = users.id
     WHERE messages.group_id = ? AND messages.created_at > ?
     ORDER BY messages.created_at ASC`,
    [groupId, timestamp],
    callback
  );
};

module.exports = { addMessage, getAllMessages, getMessagesAfter }; 