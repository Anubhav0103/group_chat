const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../models/userModel');

const signup = async (req, res) => {
  const { name, email, phone, password } = req.body;
  findUserByEmail(email, async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    createUser(name, email, phone, hashedPassword, (err, result) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  findUserByEmail(email, async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    // Create JWT with user id and name
    const token = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token, user: { id: user.id, name: user.name } });
  });
};

module.exports = { signup, login }; 