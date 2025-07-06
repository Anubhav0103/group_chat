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
const fileRoutes = require('./routes/fileRoutes');
const adminRoutes = require('./routes/adminRoutes');
app.use('/api', authRoutes);
app.use('/api', messageRoutes);
app.use('/api', userRoutes);
app.use('/api', groupRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);

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
  socket.on('join_group', (data) => {
    const { groupId } = data;
    socket.join(`group_${groupId}`);
    socket.userId = socket.userId || 'unknown';
    
    // Get all sockets in the room
    const sockets = io.sockets.adapter.rooms.get(`group_${groupId}`);
    if (sockets) {
        const socketIds = Array.from(sockets);
        const roomSockets = socketIds.map(id => io.sockets.sockets.get(id)).filter(Boolean);
    }
  });
  
  // Leave a group
  socket.on('leave-group', (groupId) => {
    socket.leave(`group_${groupId}`);
  });
  
  // Test WebSocket connection
  socket.on('test_message', (data) => {
    socket.emit('test_response', { message: 'Server received your test message!', data });
  });
  
  socket.on('disconnect', () => {
    // User disconnected
  });
});

// Setup file cleanup job (run every hour)
const FileController = require('./controllers/fileController');
setInterval(() => {
  FileController.cleanupExpiredFiles();
}, 60 * 60 * 1000); // 1 hour

// Initialize cron jobs for message archiving
const CronService = require('./services/cronService');
CronService.init();

// Make io available to other modules
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Environment variables check (only show if there are issues)
if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
    console.error('Missing required AWS environment variables');
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});