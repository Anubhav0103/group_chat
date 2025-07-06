require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Serve static files from views directory
app.use(express.static(path.join(__dirname, 'views')));

// Import routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
app.use('/api', authRoutes);
app.use('/api', messageRoutes);
app.use('/api', userRoutes);
app.use('/api', groupRoutes);

// Serve the main pages
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'chat.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  // Join user to their groups
  socket.on('join-groups', (userId) => {
    socket.userId = userId;
  });
  
  // Join a specific group
  socket.on('join-group', (groupId) => {
    socket.join(`group-${groupId}`);
  });
  
  // Leave a group
  socket.on('leave-group', (groupId) => {
    socket.leave(`group-${groupId}`);
  });
  
  socket.on('disconnect', () => {
    // User disconnected
  });
});

// Make io available to other modules
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});