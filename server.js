const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const app = express();

app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',         // use your MySQL username
  password: '',         // use your MySQL password
  database: 'group_chat'
});


app.post('/signup', async (req, res) => {
  const { name, email, phone, password } = req.body;


  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    db.query(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, hashedPassword],
      (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.status(201).json({ message: 'User registered successfully' });
      }
    );
  });
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});