const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',         // use your MySQL username
  password: '',         // use your MySQL password
  database: 'group_chat'
});

module.exports = db; 