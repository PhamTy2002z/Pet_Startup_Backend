require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const commonRoutes = require('./routes/common');
const { startReminderJob } = require('./utils/scheduler');

const app = express();

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

app.use(cors());
app.use(bodyParser.json());

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api', commonRoutes);
app.use('/api/admin', require('./routes/admin'));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Handle frontend routes
app.get(['/', '/edit/:id'], (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the reminder scheduler
startReminderJob();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
