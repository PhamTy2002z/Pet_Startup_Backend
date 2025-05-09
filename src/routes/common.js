// src/routes/common.js
const express = require('express');
const router = express.Router();
const { getAvatar } = require('../controllers/petImageController');

// Public: stream avatar qua GridFS
// URL: GET /api/avatar/:id
router.get('/avatar/:id', getAvatar);

module.exports = router;
