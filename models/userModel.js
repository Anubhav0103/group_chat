const { db } = require('../config/db');

const findUserByEmail = async (email) => {
  try {
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return results;
  } catch (error) {
    throw error;
  }
};

const createUser = async (name, email, phone, hashedPassword) => {
  try {
    const [result] = await db.query(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, hashedPassword]
    );
    return result;
  } catch (error) {
    throw error;
  }
};

const getOnlineUsers = async () => {
  try {
    const [results] = await db.query(
      `SELECT DISTINCT users.id, users.name 
       FROM users 
       JOIN messages ON users.id = messages.user_id 
       ORDER BY users.name`
    );
    return results;
  } catch (error) {
    throw error;
  }
};

const findUserById = async (userId) => {
  try {
    const [results] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    return results;
  } catch (error) {
    throw error;
  }
};

module.exports = { findUserByEmail, createUser, getOnlineUsers, findUserById }; 