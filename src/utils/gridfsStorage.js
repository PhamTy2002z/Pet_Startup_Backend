const { GridFsStorage } = require('multer-gridfs-storage');
require('dotenv').config();

const storage = new GridFsStorage({
  url: process.env.MONGODB_URI,
  file: (req, file) => ({
    bucketName: 'avatars',           // bucket trong MongoDB
    filename: `avatar-${Date.now()}${file.originalname}`
  })
});

module.exports = storage;
