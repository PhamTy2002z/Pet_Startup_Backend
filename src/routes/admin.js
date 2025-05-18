//src/routes/admin.js
const express = require('express');
const router  = express.Router();
const wrap    = require('../utils/asyncWrap');
const authAdmin = require('../middleware/authAdmin');

const {
  createPet,
  getAllPets,
  createBulkPets,
  searchPets,
} = require('../controllers/adminController');

const {
  uploadAvatar,
} = require('../controllers/petImageController');

const {
  createTheme,
  getAllThemes,
  getThemeById,
  updateTheme,
  deleteTheme,
  uploadThemeImage,
  batchUpdateThemeStatus,
  updateThemeOrder,
} = require('../controllers/themeController');

const { checkRemindersNow } = require('../utils/scheduler');

/* ------- All /admin requires JWT-Admin ------- */
router.use(authAdmin);

/* ---- Pet management ---- */
router.post('/pets',            wrap(createPet));
router.post('/pets/bulk',       wrap(createBulkPets));
router.get ('/pets',            wrap(getAllPets));
router.get ('/pets/search',     wrap(searchPets));
router.post('/pets/:id/avatar', uploadAvatar);

/* ---- Theme management ---- */
router.post   ('/themes',                 uploadThemeImage, wrap(createTheme));
router.get    ('/themes',                 wrap(getAllThemes));
router.get    ('/themes/:id',             wrap(getThemeById));
router.put    ('/themes/:id',             uploadThemeImage, wrap(updateTheme));
router.delete ('/themes/:id',             wrap(deleteTheme));
router.put    ('/themes/batch-status',    wrap(batchUpdateThemeStatus));
router.put    ('/themes/order',           wrap(updateThemeOrder));

/* ---- Manual reminder test ---- */
router.post('/test-reminders', wrap(async (req, res) => {
  const result = await checkRemindersNow();
  res.json(result);
}));

module.exports = router;
