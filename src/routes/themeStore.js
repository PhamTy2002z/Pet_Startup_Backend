const express = require('express');
const router = express.Router();
const Theme = require('../models/Theme');
const UserTheme = require('../models/UserTheme');
const ThemeRedemptionCode = require('../models/ThemeRedemptionCode');
const { register, login, getCurrentUser } = require('../controllers/themeStoreAuthController');
const { requireThemeStoreAuth } = require('../middleware/themeStoreAuth');

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireThemeStoreAuth, getCurrentUser);

// Theme routes - Public
router.get('/themes', async (_req, res, next) => {
  try {
    const list = await Theme.find({ isActive: true, inStore: true })
                          .sort({ order: 1, createdAt: -1 });
    res.json(list);
  } catch (err) { next(err); }
});

// Purchase a theme and generate a redemption code
router.post('/purchase', requireThemeStoreAuth, async (req, res, next) => {
  try {
    const { themeId } = req.body;
    const theme = await Theme.findById(themeId);
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Don't allow purchase of inactive or non-store themes
    if (!theme.isActive || !theme.inStore) {
      return res.status(400).json({ error: 'Theme is not available' });
    }

    // Create user theme record linked to the theme store user
    const userTheme = await UserTheme.create({
      themeStoreUserId: req.user.id,
      themeId,
      transactionDetails: { amount: theme.price }
    });

    // Generate redemption code
    const redemptionCode = await ThemeRedemptionCode.create({
      themeId,
      createdBy: req.user.id
    });

    res.json({ 
      success: true, 
      userTheme,
      redemptionCode: {
        code: redemptionCode.code,
        expiresAt: redemptionCode.expiresAt,
        theme: {
          id: theme._id,
          name: theme.name
        }
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Already purchased' });
    }
    next(err);
  }
});

// Get purchased themes with redemption codes for a theme store user
router.get('/purchases', requireThemeStoreAuth, async (req, res, next) => {
  try {
    // Get all user purchases
    const purchases = await UserTheme.find({ 
      themeStoreUserId: req.user.id 
    }).populate('themeId');
    
    // Get all redemption codes created by the user
    const redemptionCodes = await ThemeRedemptionCode.find({
      createdBy: req.user.id
    }).populate('themeId');
    
    // Format response
    const result = purchases
      .filter(purchase => purchase.themeId?.isActive)
      .map(purchase => {
        // Find all codes for this theme
        const codes = redemptionCodes.filter(code => 
          code.themeId._id.toString() === purchase.themeId._id.toString()
        );
        
        return {
          purchase: {
            id: purchase._id,
            purchaseDate: purchase.purchaseDate,
            transactionDetails: purchase.transactionDetails
          },
          theme: purchase.themeId,
          redemptionCodes: codes.map(code => ({
            code: code.code,
            status: code.status,
            expiresAt: code.expiresAt,
            redeemedAt: code.redeemedAt,
            redeemedBy: code.redeemedBy
          }))
        };
      });
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Generate a new redemption code for an already purchased theme
router.post('/generate-code', requireThemeStoreAuth, async (req, res, next) => {
  try {
    const { themeId } = req.body;
    
    // Check if user has purchased this theme
    const purchase = await UserTheme.findOne({
      themeStoreUserId: req.user.id,
      themeId
    });
    
    if (!purchase) {
      return res.status(403).json({ error: 'You must purchase this theme first' });
    }
    
    // Generate a new redemption code
    const redemptionCode = await ThemeRedemptionCode.create({
      themeId,
      createdBy: req.user.id
    });
    
    const theme = await Theme.findById(themeId);
    
    res.json({
      success: true,
      redemptionCode: {
        code: redemptionCode.code,
        expiresAt: redemptionCode.expiresAt,
        theme: {
          id: theme._id,
          name: theme.name
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 