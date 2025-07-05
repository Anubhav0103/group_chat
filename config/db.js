const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'group_chat',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
});

// Add error handling
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully');
  }
});

db.on('error', (err) => {
  console.error('Database error:', err);
});

module.exports = db; 