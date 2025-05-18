//src/routes/user.js
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const wrap    = require('../utils/asyncWrap');
const router  = express.Router();

const {
  getPetById,
  updatePet,
  updatePetOwnerEmail,
  updateAllergicInfo,
  updatePetDescription,
} = require('../controllers/userController');

const {
  getActiveThemes,
  getStoreThemes,
  getPurchasedThemes,
  purchaseTheme,
  applyPurchasedTheme,
} = require('../controllers/themeController');

const { uploadAvatar }   = require('../controllers/petImageController');
const { sendReminderEmail, testEmailConfig } = require('../utils/mail');

/* ===== Middleware ghi log ===== */
router.use((req, _res, next) => {
  console.log(`[USER] ${req.method} ${req.originalUrl}`);
  next();
});

/* ===== Pet profile (public) ===== */
router.get('/pets/:id', wrap(getPetById));

/* ===== Pet owner actions (require token QR) =====
   TODO: gắn middleware authPet khi bạn triển khai QR-token
*/
router.put   ('/pets/:id',                 wrap(updatePet));
router.post  ('/pets/:id/owner-email',     wrap(updatePetOwnerEmail));
router.put   ('/pets/:id/allergic-info',   wrap(updateAllergicInfo));
router.put   ('/pets/:id/description',     wrap(updatePetDescription));
router.post  ('/pets/:id/avatar',          uploadAvatar);

/* Back-compat legacy PUT /pet/:id/theme */
router.put('/pets/:id/theme', (req, res) => {
  req.body.petId = req.params.id;
  return applyPurchasedTheme(req, res);
});

/* ===== Theme store & purchasing ===== */
router.get ('/themes',                wrap(getActiveThemes));     // free + purchased
router.get ('/store/themes',          wrap(getStoreThemes));
router.get ('/purchased-themes/:petId', wrap(getPurchasedThemes));
router.post('/purchase-theme',        wrap(purchaseTheme));
router.post('/apply-theme',           wrap(applyPurchasedTheme));

/* ===== Asset check (debug) ===== */
router.get('/theme-image-check/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const imgPath  = path.join(process.cwd(), 'public', 'uploads', 'themes', filename);
  fs.access(imgPath, fs.constants.F_OK, (err) =>
    err
      ? res.status(404).json({ exists: false })
      : res.json({ exists: true, path: `/uploads/themes/${filename}` })
  );
});

/* ===== Email helpers ===== */
router.post('/pets/:id/send-reminder', wrap(async (req, res) => {
  const { to, petName, revisitDate } = req.body;
  if (!to || !petName || !revisitDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  await sendReminderEmail(to, petName, revisitDate);
  res.json({ message: 'Reminder email sent' });
}));

router.get('/test-email-config', wrap(async (_req, res) => {
  (await testEmailConfig())
    ? res.json({ message: 'Email config OK' })
    : res.status(500).json({ message: 'Email config invalid' });
}));

router.post('/test-reminder', wrap(async (req, res) => {
  const { to, petName, appointmentDate, note } = req.body;
  if (!to || !petName || !appointmentDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const appointmentInfo = note
    ? `${new Date(appointmentDate).toLocaleDateString('vi-VN')} (Ghi chú: ${note})`
    : new Date(appointmentDate).toLocaleDateString('vi-VN');

  const result = await sendReminderEmail(to, petName, appointmentInfo);
  res.json({ message: 'Sent', messageId: result.messageId });
}));

module.exports = router;
