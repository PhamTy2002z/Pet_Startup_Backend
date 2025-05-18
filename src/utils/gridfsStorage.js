//src/utils/gridfsStorage.js
const { GridFsStorage } = require('multer-gridfs-storage');
require('dotenv').config();

/* Lưu avatar vào bucket "avatars" */
module.exports = new GridFsStorage({
  url: process.env.MONGODB_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (_req, file) => ({
    bucketName: 'avatars',
    filename  : `avatar-${Date.now()}-${file.originalname}`,
  }),
});
