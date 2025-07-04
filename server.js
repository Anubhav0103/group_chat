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
const groupRoutes = require('./routes/groupRoutes');
app.use('/api', authRoutes);
app.use('/api', messageRoutes);
app.use('/api', userRoutes);
app.use('/api', groupRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});