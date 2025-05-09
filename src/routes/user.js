// src/routes/user.js
const express = require('express');
const router  = express.Router();
const { getPetById, updatePet } = require('../controllers/userController');
const { uploadAvatar } = require('../controllers/petImageController');

// Lấy pet để hiển thị form
router.get('/pet/:id', getPetById);

// Cập nhật thông tin pet (info, owner, vaccinations)
router.put('/pet/:id', updatePet);

// Upload avatar (cho user, không cần authAdmin)
router.post('/pet/:id/avatar', uploadAvatar);


module.exports = router;
