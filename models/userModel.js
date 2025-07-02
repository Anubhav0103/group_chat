const db = require('../config/db');

const findUserByEmail = (email, callback) => {
  db.query('SELECT * FROM users WHERE email = ?', [email], callback);
};

const createUser = (name, email, phone, hashedPassword, callback) => {
  db.query(
    'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
    [name, email, phone, hashedPassword],
    callback
  );
};

module.exports = { findUserByEmail, createUser }; 