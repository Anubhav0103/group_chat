require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());


const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
app.use('/api', authRoutes);
app.use('/api', messageRoutes);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});