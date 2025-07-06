const { db } = require('../config/db');

const addMessage = async (userId, groupId, message) => {
  try {
    const [result] = await db.query(
      'INSERT INTO messages (user_id, group_id, message) VALUES (?, ?, ?)',
      [userId, groupId, message]
    );
    return result;
  } catch (error) {
    throw error;
  }
};

const getAllMessages = async (groupId) => {
  try {
    const [results] = await db.query(
      `SELECT messages.id, messages.message, messages.created_at, messages.user_id as userId, users.name as senderName
       FROM messages
       JOIN users ON messages.user_id = users.id
       WHERE messages.group_id = ?
       ORDER BY messages.created_at ASC`,
      [groupId]
    );
    return results;
  } catch (error) {
    throw error;
  }
};

const getMessagesAfter = async (groupId, timestamp) => {
  try {
    const [results] = await db.query(
      `SELECT messages.id, messages.message, messages.created_at, messages.user_id as userId, users.name as senderName
       FROM messages
       JOIN users ON messages.user_id = users.id
       WHERE messages.group_id = ? AND messages.created_at > ?
       ORDER BY messages.created_at ASC`,
      [groupId, timestamp]
    );
    return results;
  } catch (error) {
    throw error;
  }
};

module.exports = { addMessage, getAllMessages, getMessagesAfter }; 