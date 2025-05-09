// src/controllers/petImageController.js
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const multer = require('multer');

// Use memory storage to buffer file
const storage = multer.memoryStorage();
const upload = multer({ storage });

exports.uploadAvatar = [
  upload.single('avatar'),  // field name = "avatar"
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const bucket = req.app.locals.gfsBucket;
      // Create upload stream
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype
      });

      // Write buffer to stream
      uploadStream.end(req.file.buffer);

      uploadStream.on('finish', async () => {
        const fileId = uploadStream.id;  // GridFS file id
        try {
          const pet = await Pet.findByIdAndUpdate(
            req.params.id,
            { avatarFileId: fileId },
            { new: true, runValidators: true }
          );
          if (!pet) return res.sendStatus(404);
          res.json(pet);
        } catch (err) {
          console.error('Error updating Pet with avatarFileId:', err);
          res.status(500).json({ error: err.message });
        }
      });

      uploadStream.on('error', err => {
        console.error('GridFS upload error:', err);
        res.status(500).json({ error: err.message });
      });
    } catch (err) {
      console.error('Error in uploadAvatar:', err);
      res.status(500).json({ error: err.message });
    }
  }
];

exports.getAvatar = (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const bucket = req.app.locals.gfsBucket;

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on('error', () => {
      return res.sendStatus(404);
    });
    // Đặt Content-Type nếu bạn muốn
    // res.set('Content-Type', 'image/jpeg');
    downloadStream.pipe(res);
  } catch (err) {
    console.error('Error streaming avatar:', err);
    res.sendStatus(400);
  }
};