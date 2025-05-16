const express = require('express');
const router = express.Router();
const { 
  getPetById, 
  updatePet, 
  updatePetOwnerEmail, 
  updateAllergicInfo, 
  updatePetDescription 
} = require('../controllers/userController');
const { 
  getActiveThemes, 
  getStoreThemes, 
  getPurchasedThemes, 
  purchaseTheme, 
  applyPurchasedTheme 
} = require('../controllers/themeController');
const { uploadAvatar } = require('../controllers/petImageController');
const { sendReminderEmail, testEmailConfig } = require('../utils/mail'); // Import hàm gửi email
const fs = require('fs');
const path = require('path');

// Debug middleware
router.use((req, res, next) => {
  console.log('User route accessed:', req.method, req.originalUrl);
  next();
});

// Lấy pet để hiển thị form
router.get('/pet/:id', getPetById);

// Cập nhật thông tin pet (info, owner, vaccinations)
router.put('/pet/:id', updatePet);

// Cập nhật email của chủ Pet
router.post('/pet/:id/owner/email', updatePetOwnerEmail);

// Cập nhật thông tin dị ứng của pet
router.put('/pet/:id/allergic-info', updateAllergicInfo);

// Cập nhật mô tả (description) của pet
router.put('/pet/:id/description', updatePetDescription);

// Upload avatar (cho user, không cần authAdmin)
router.post('/pet/:id/avatar', uploadAvatar);

// This route is now deprecated in favor of the new apply-theme endpoint, 
// but we'll keep it with the new implementation for backward compatibility
router.put('/pet/:id/theme', (req, res) => {
  // Simply forward to our new applyPurchasedTheme with the right format
  req.body.petId = req.params.id;
  return applyPurchasedTheme(req, res);
});

// Theme routes
// Get all active themes available to a pet (free and purchased)
router.get('/themes', getActiveThemes);

// Get all themes available in the store
router.get('/store/themes', getStoreThemes);

// Get all themes purchased by a pet
router.get('/purchased-themes/:petId', getPurchasedThemes);

// Purchase a theme
router.post('/purchase-theme', purchaseTheme);

// Apply a purchased theme to a pet
router.post('/apply-theme', applyPurchasedTheme);

// Check if a theme image exists
router.get('/theme-image-check/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(process.cwd(), 'public', 'uploads', 'themes', filename);
  
  // Check if file exists
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ 
        exists: false, 
        message: 'Image not found',
        requestedPath: `/uploads/themes/${filename}`
      });
    }
    
    // File exists
    res.json({ 
      exists: true, 
      path: `/uploads/themes/${filename}`,
      fullPath: imagePath
    });
  });
});

// Test email route (gửi email nhắc lịch)
router.post('/pet/:id/send-reminder', async (req, res) => {
  try {
    const { to, petName, revisitDate } = req.body;
    
    // Kiểm tra đầu vào
    if (!to || !petName || !revisitDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Gửi email nhắc lịch
    await sendReminderEmail(to, petName, revisitDate);

    return res.status(200).json({ message: 'Reminder email sent successfully!' });
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

// Test email configuration
router.get('/test-email-config', async (req, res) => {
  try {
    const isValid = await testEmailConfig();
    if (isValid) {
      res.json({ message: 'Email configuration is valid' });
    } else {
      res.status(500).json({ message: 'Email configuration is invalid' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error testing email configuration', error: error.message });
  }
});

// Test sending a reminder email
router.post('/test-reminder', async (req, res) => {
  try {
    const { to, petName, appointmentDate, note } = req.body;
    
    if (!to || !petName || !appointmentDate) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['to', 'petName', 'appointmentDate']
      });
    }

    // Format the appointment info with note if provided
    const formattedDate = new Date(appointmentDate).toLocaleDateString('vi-VN');
    const appointmentInfo = note ? `${formattedDate} (Ghi chú: ${note})` : formattedDate;

    const result = await sendReminderEmail(to, petName, appointmentInfo);
    res.json({ 
      message: 'Test reminder email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending test reminder:', error);
    res.status(500).json({ 
      message: 'Failed to send test reminder',
      error: error.message 
    });
  }
});

module.exports = router;
