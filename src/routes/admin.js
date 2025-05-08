// src/routes/admin.js
const express = require('express');
const router  = express.Router();
const { createPet, getAllPets } = require('../controllers/adminController');

// Tạo mới pet + QR
router.post('/pet', createPet);

// Lấy danh sách pet
router.get('/pets', getAllPets);

module.exports = router;
