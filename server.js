require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
app.use('/api', authRoutes);
app.use('/api', messageRoutes);
app.use('/api', userRoutes);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});