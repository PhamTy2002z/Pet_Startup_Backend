require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const commonRoutes = require('./routes/common');
const { startReminderJob } = require('./utils/scheduler');

const app = express();

// Cấu hình CORS
const corsOptions = {
  origin: (origin, callback) => {
    // Cho phép yêu cầu từ localhost khi phát triển và từ Render khi deploy
    const allowedOrigins = ['http://localhost:3000', 'https://pet-startup-frontend.onrender.com'];
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);  // cho phép yêu cầu
    } else {
      callback(new Error('Not allowed by CORS'));  // từ chối yêu cầu
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],   // Các phương thức HTTP mà backend cho phép
  allowedHeaders: ['Content-Type', 'Authorization'],  // Các header cho phép
  credentials: true,  // Nếu bạn đang sử dụng cookie hoặc Authorization header
};

app.use(cors(corsOptions));  // Áp dụng CORS với cấu hình mới

app.use(cors(corsOptions));

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const conn = mongoose.connection;
conn.once('open', () => {
  console.log('MongoDB connected');
  app.locals.gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'avatars'
  });
});

app.use(bodyParser.json());

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api', commonRoutes);
app.use('/api/admin', require('./routes/admin'));

// Serve static files from the React app
const distPath = path.join(__dirname, '../dist');
console.log('Looking for static files in:', distPath);

// Check if dist directory exists
const fs = require('fs');
if (!fs.existsSync(distPath)) {
  console.warn('Warning: dist directory not found. Make sure to build the frontend first.');
}

app.use(express.static(distPath));

// Handle frontend routes
app.get(['/', '/edit/:id'], (req, res, next) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next(new Error('Frontend build not found. Please build the frontend first.'));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message || 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start the reminder scheduler
startReminderJob();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
