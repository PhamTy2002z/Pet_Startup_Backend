// src/server.js
require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const conn = mongoose.connection;
conn.once('open', () => {
  console.log('MongoDB connected');
  // Setup GridFS bucket for avatars
  app.locals.gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'avatars'
  });
});

app.use(cors());
app.use(bodyParser.json());

// Public routes
app.use('/api/auth', require('./routes/auth'));      // login admin
app.use('/api/user', require('./routes/user'));      // user-edit form endpoints

// Protected admin routes (middleware applied in routes/admin.js)
app.use('/api/admin', require('./routes/admin'));

// Stream avatar files from GridFS
app.get('/api/admin/avatar/:id', (req, res) => {
  const bucket = app.locals.gfsBucket;
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    bucket.openDownloadStream(fileId)
      .on('error', () => res.sendStatus(404))
      .pipe(res);
  } catch {
    res.sendStatus(400);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
