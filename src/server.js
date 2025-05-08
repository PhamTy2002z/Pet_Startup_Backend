// src/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

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

app.use('/api/admin', require('./routes/admin'));
app.use('/api/user',  require('./routes/user'));

// Stream file GridFS:
app.get('/api/admin/avatar/:id', (req, res) => {
  const bucket = app.locals.gfsBucket;
  const fileId = new mongoose.Types.ObjectId(req.params.id);
  bucket.openDownloadStream(fileId)
    .on('error', () => res.sendStatus(404))
    .pipe(res);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
