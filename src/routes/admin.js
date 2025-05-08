// src/routes/admin.js
const express = require('express');
const router  = express.Router();
const { createPet, getAllPets } = require('../controllers/adminController');
const { uploadAvatar } = require('../controllers/petImageController');


// Tạo mới pet + QR
router.post('/pet', createPet);

// Lấy danh sách pet
router.get('/pets', getAllPets);

// POST /api/admin/pet/:id/avatar
router.post('/pet/:id/avatar', uploadAvatar);

module.exports = router;
