const express = require('express');
const router = express.Router();
const { getPetById, updatePet, updatePetOwnerEmail } = require('../controllers/userController');
const { uploadAvatar } = require('../controllers/petImageController');

// Lấy pet để hiển thị form
router.get('/pet/:id', getPetById);

// Cập nhật thông tin pet (info, owner, vaccinations)
router.put('/pet/:id', updatePet);

// Cập nhật email của chủ Pet
router.put('/pet/:id/owner-email', updatePetOwnerEmail);

// Upload avatar (cho user, không cần authAdmin)
router.post('/pet/:id/avatar', uploadAvatar);

module.exports = router;
