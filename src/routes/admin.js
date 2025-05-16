// src/routes/admin.js
const express = require('express');
const router = express.Router();
const authAdmin = require('../middleware/authAdmin');
const {
  createPet,
  getAllPets,
  createBulkPets,
  searchPets
} = require('../controllers/adminController');
const { uploadAvatar } = require('../controllers/petImageController');
const { checkRemindersNow } = require('../utils/scheduler');
const {
  createTheme,
  getAllThemes,
  getThemeById,
  updateTheme,
  deleteTheme,
  uploadThemeImage,
  batchUpdateThemeStatus,
  updateThemeOrder
} = require('../controllers/themeController');


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

// Upload avatar
router.post('/pet/:id/avatar', uploadAvatar);

// Theme management routes
router.post('/themes', uploadThemeImage, createTheme);
router.get('/themes', getAllThemes);
router.put('/themes/batch-status', batchUpdateThemeStatus);
router.put('/themes/order', updateThemeOrder);
router.get('/themes/:id', getThemeById);
router.put('/themes/:id', uploadThemeImage, updateTheme);
router.delete('/themes/:id', deleteTheme);

// Test reminder emails manually
router.post('/test-reminders', async (req, res) => {
  try {
    const result = await checkRemindersNow();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
