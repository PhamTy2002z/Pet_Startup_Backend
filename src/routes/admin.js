// src/routes/admin.js
const express = require('express');
const router  = express.Router();
const authAdmin = require('../middleware/authAdmin');
const {
  createPet,
  getAllPets,
  createBulkPets,
  searchPets,
  updatePetStatus
} = require('../controllers/adminController');
const { uploadAvatar } = require('../controllers/petImageController');


// Trước hết tất cả đều phải auth
router.use(authAdmin);
// Tạo mới pet + QR
router.post('/pet', createPet);

// Tạo hàng loạt pet + QR
router.post('/pets/bulk', createBulkPets);

// Lấy danh sách pet
router.get('/pets', getAllPets);

// Search pets with filters
router.get('/pets/search', searchPets);

// Update pet status
router.patch('/pet/:id/status', updatePetStatus);

// Upload avatar
router.post('/pet/:id/avatar', uploadAvatar);


module.exports = router;
