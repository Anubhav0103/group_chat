const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'group_chat',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
});

module.exports = db; 