const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../models/userModel');

const signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    const existingUsers = await findUserByEmail(email);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser(name, email, phone, hashedPassword);
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const results = await findUserByEmail(email);
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    // Create JWT with user id and name
    const token = jwt.sign(
      { id: user.id, name: user.name }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '1h' }
    );
    
    res.status(200).json({ 
      message: 'Login successful', 
      token, 
      user: { id: user.id, name: user.name } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { signup, login }; 