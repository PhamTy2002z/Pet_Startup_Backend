// src/controllers/themeRedemptionController.js
const ThemeRedemptionCode = require('../models/ThemeRedemptionCode');
const Theme               = require('../models/Theme');
const Pet                 = require('../models/Pet');
const UserTheme           = require('../models/UserTheme');

exports.redeemCode = async (req, res) => {
  try {
    const { code, petId } = req.body;
    if (!code || !petId)
      return res.status(400).json({ error: 'Redemption code and pet ID are required' });

    const redemptionCode = await ThemeRedemptionCode.findOne({ code: code.toUpperCase() });
    if (!redemptionCode) return res.status(404).json({ error: 'Invalid redemption code' });

    if (redemptionCode.status === 'redeemed')
      return res.status(400).json({ error: 'This code has already been redeemed' });

    if (redemptionCode.status === 'expired' || new Date() > redemptionCode.expiresAt) {
      if (redemptionCode.status !== 'expired') {
        redemptionCode.status = 'expired';
        await redemptionCode.save();
      }
      return res.status(400).json({ error: 'This code has expired' });
    }

    const pet = await Pet.findById(petId);
    if (!pet) return res.status(404).json({ error: 'Pet not found' });

    const theme = await Theme.findById(redemptionCode.themeId).select(
      'name description imageUrl presetKey isActive price',
    );
    if (!theme || !theme.isActive)
      return res.status(400).json({ error: 'The theme is no longer available' });

    redemptionCode.status     = 'redeemed';
    redemptionCode.redeemedBy = petId;
    redemptionCode.redeemedAt = new Date();
    await redemptionCode.save();

    const existingPurchase = await UserTheme.findOne({ petId, themeId: theme._id });
    if (!existingPurchase) {
      await UserTheme.create({
        petId,
        themeId: theme._id,
        transactionDetails: {
          amount       : theme.price,
          status       : 'completed',
          transactionId: `REDEEM-${redemptionCode.code}`,
        },
      });
    }

    pet.themeId = theme._id;
    await pet.save();

    res.json({
      success: true,
      message: 'Theme redeemed successfully!',
      theme: {
        id        : theme._id,
        name      : theme.name,
        description: theme.description,
        imageUrl  : theme.imageUrl,
        presetKey : theme.presetKey,
      },
      pet: { id: pet._id, name: pet.name },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRedemptionHistory = async (req, res) => {
  try {
    const { petId } = req.params;
    if (!petId) return res.status(400).json({ error: 'Pet ID is required' });

    const redemptions = await ThemeRedemptionCode.find({
      redeemedBy: petId,
      status    : 'redeemed',
    }).populate('themeId', 'name description imageUrl presetKey');

    res.json(
      redemptions.map((r) => ({
        code      : r.code,
        redeemedAt: r.redeemedAt,
        expiresAt : r.expiresAt,
        theme: {
          id        : r.themeId._id,
          name      : r.themeId.name,
          description: r.themeId.description,
          imageUrl  : r.themeId.imageUrl,
          presetKey : r.themeId.presetKey,
        },
      })),
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.validateCode = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ error: 'Redemption code is required' });

    const redemptionCode = await ThemeRedemptionCode.findOne({ code: code.toUpperCase() })
      .populate('themeId', 'name description imageUrl presetKey');

    if (!redemptionCode) return res.status(404).json({ error: 'Invalid redemption code' });

    if (redemptionCode.status === 'redeemed')
      return res.status(400).json({
        valid: false,
        error: 'This code has already been redeemed',
        status: 'redeemed',
      });

    if (redemptionCode.status === 'expired' || new Date() > redemptionCode.expiresAt)
      return res.status(400).json({
        valid: false,
        error: 'This code has expired',
        status: 'expired',
      });

    res.json({
      valid: true,
      code : redemptionCode.code,
      expiresAt: redemptionCode.expiresAt,
      theme: {
        id        : redemptionCode.themeId._id,
        name      : redemptionCode.themeId.name,
        description: redemptionCode.themeId.description,
        imageUrl  : redemptionCode.themeId.imageUrl,
        presetKey : redemptionCode.themeId.presetKey,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
