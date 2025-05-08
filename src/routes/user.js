// src/routes/user.js
const express = require('express');
const router  = express.Router();
const { getPetById, updatePet } = require('../controllers/userController');

// Lấy pet để hiển thị form
router.get('/pet/:id', getPetById);

// Chỉ cho phép edit
router.put('/pet/:id', updatePet);

module.exports = router;
