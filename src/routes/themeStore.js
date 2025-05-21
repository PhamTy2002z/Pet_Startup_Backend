// src/routes/themeStore.js
const express = require('express');
const router  = express.Router();
const Theme   = require('../models/Theme');
const UserTheme          = require('../models/UserTheme');
const ThemeRedemptionCode = require('../models/ThemeRedemptionCode');
const { register, login, getCurrentUser } = require('../controllers/themeStoreAuthController');
const { requireThemeStoreAuth } = require('../middleware/themeStoreAuth');

/* ---------- Auth ---------- */
router.post('/auth/register', register);
router.post('/auth/login',    login);
router.get ('/auth/me', requireThemeStoreAuth, getCurrentUser);

/* ---------- Public theme list ---------- */
router.get('/themes', async (_req, res, next) => {
  try {
    const list = await Theme.find({ isActive: true, inStore: true })
      .sort({ order: 1, createdAt: -1 })
      .select('name imageUrl description price isPremium presetKey');
    res.json(list);
  } catch (err) { next(err); }
});

/* ---------- Purchase + redemption code ---------- */
router.post('/purchase', requireThemeStoreAuth, async (req, res, next) => {
  try {
    const { themeId } = req.body;
    const theme = await Theme.findById(themeId);
    if (!theme) return res.status(404).json({ error: 'Theme not found' });
    if (!theme.isActive || !theme.inStore)
      return res.status(400).json({ error: 'Theme is not available' });

    const userTheme = await UserTheme.create({
      themeStoreUserId: req.user.id,
      themeId,
      transactionDetails: { amount: theme.price },
    });

    const redemptionCode = await ThemeRedemptionCode.create({
      themeId,
      createdBy: req.user.id,
    });

    res.json({
      success: true,
      userTheme,
      redemptionCode: {
        code     : redemptionCode.code,
        expiresAt: redemptionCode.expiresAt,
        theme: {
          id       : theme._id,
          name     : theme.name,
          presetKey: theme.presetKey,
        },
      },
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: 'Already purchased' });
    next(err);
  }
});

/* ---------- Purchases list ---------- */
router.get('/purchases', requireThemeStoreAuth, async (req, res, next) => {
  try {
    const purchases = await UserTheme.find({
      themeStoreUserId: req.user.id,
    }).populate('themeId', 'name imageUrl description price isPremium presetKey');

    const redemptionCodes = await ThemeRedemptionCode.find({
      createdBy: req.user.id,
    }).populate('themeId', 'presetKey');

    const result = purchases
      .filter((p) => p.themeId?.isActive)
      .map((purchase) => {
        const codes = redemptionCodes.filter(
          (c) => c.themeId._id.toString() === purchase.themeId._id.toString(),
        );
        return {
          purchase: {
            id               : purchase._id,
            purchaseDate     : purchase.purchaseDate,
            transactionDetails: purchase.transactionDetails,
          },
          theme: purchase.themeId,
          redemptionCodes: codes.map((c) => ({
            code      : c.code,
            status    : c.status,
            expiresAt : c.expiresAt,
            redeemedAt: c.redeemedAt,
            redeemedBy: c.redeemedBy,
          })),
        };
      });

    res.json(result);
  } catch (err) { next(err); }
});

/* ---------- Generate extra code ---------- */
router.post('/generate-code', requireThemeStoreAuth, async (req, res, next) => {
  try {
    const { themeId } = req.body;

    const purchase = await UserTheme.findOne({
      themeStoreUserId: req.user.id,
      themeId,
    });
    if (!purchase)
      return res.status(403).json({ error: 'You must purchase this theme first' });

    const redemptionCode = await ThemeRedemptionCode.create({
      themeId,
      createdBy: req.user.id,
    });

    const theme = await Theme.findById(themeId);

    res.json({
      success: true,
      redemptionCode: {
        code     : redemptionCode.code,
        expiresAt: redemptionCode.expiresAt,
        theme: {
          id       : theme._id,
          name     : theme.name,
          presetKey: theme.presetKey,
        },
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
