// src/routes/common.js
const express = require('express');
const router = express.Router();
const { getAvatar } = require('../controllers/petImageController');
const path = require('path');
const fs = require('fs');

// Public: stream avatar qua GridFS
// URL: GET /api/avatar/:id
router.get('/avatar/:id', getAvatar);

// Serve theme images directly
router.get('/theme-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(process.cwd(), 'public', 'uploads', 'themes', filename);
  
  // Check if file exists
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send('Image not found');
    }
    
    // Send the file
    res.sendFile(imagePath);
  });
});

module.exports = router;
