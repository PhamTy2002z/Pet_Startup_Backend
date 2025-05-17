// src/routes/store.js
const express = require('express');
const Theme        = require('../models/Theme');
const Pet          = require('../models/Pet');
const UserTheme    = require('../models/UserTheme');

const router = express.Router();

/*  GET /api/v1/store/themes
    Trả về các theme đang bán (isActive = true && inStore = true)          */
router.get('/themes', async (_req, res, next) => {
  try {
    const list = await Theme.find({ isActive: true, inStore: true })
                            .sort({ order: 1, createdAt: -1 });
    res.json(list);
  } catch (err) { next(err); }
});

/*  POST /api/v1/store/purchase
    body: { petId, themeId }                                               */
router.post('/purchase', async (req, res, next) => {
  try {
    const { petId, themeId } = req.body;
    const theme = await Theme.findById(themeId);
    if (!theme)     return res.status(404).json({ error: 'Theme not found' });

    // Không cho mua theme ẩn / chưa active
    if (!theme.isActive || !theme.inStore)
      return res.status(400).json({ error: 'Theme is not available' });

    // Ghi vào bảng UserTheme (đã có unique index petId + themeId)
    const userTheme = await UserTheme.create({
      petId,
      themeId,
      transactionDetails: { amount: theme.price }
    });

    res.json({ success: true, userTheme });
  } catch (err) {                       // Trùng key (đã mua) → 11000
    if (err.code === 11000)
      return res.status(400).json({ error: 'Already purchased' });
    next(err);
  }
});

/*  POST /api/v1/store/apply
    body: { petId, themeId }
    – chỉ cho apply nếu theme free hoặc đã mua                             */
router.post('/apply', async (req, res, next) => {
  try {
    const { petId, themeId } = req.body;
    const theme = await Theme.findById(themeId);
    if (!theme) return res.status(404).json({ error: 'Theme not found' });

    if (theme.isPremium) {
      const owned = await UserTheme.findOne({ petId, themeId });
      if (!owned)
        return res.status(400).json({ error: 'Theme not purchased' });
    }

    await Pet.findByIdAndUpdate(petId, { themeId });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
