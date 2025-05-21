const ThemeRedemptionCode = require('../models/ThemeRedemptionCode');
const Theme = require('../models/Theme');
const Pet = require('../models/Pet');
const UserTheme = require('../models/UserTheme');

/**
 * Validate and redeem a theme code for a pet
 */
exports.redeemCode = async (req, res) => {
  try {
    const { code, petId } = req.body;
    
    if (!code || !petId) {
      return res.status(400).json({ error: 'Redemption code and pet ID are required' });
    }
    
    // Find the redemption code
    const redemptionCode = await ThemeRedemptionCode.findOne({ code: code.toUpperCase() });
    
    if (!redemptionCode) {
      return res.status(404).json({ error: 'Invalid redemption code' });
    }
    
    // Check if code is already redeemed
    if (redemptionCode.status === 'redeemed') {
      return res.status(400).json({ error: 'This code has already been redeemed' });
    }
    
    // Check if code is expired
    if (redemptionCode.status === 'expired' || new Date() > redemptionCode.expiresAt) {
      // If not explicitly marked as expired but is expired by date
      if (redemptionCode.status !== 'expired') {
        redemptionCode.status = 'expired';
        await redemptionCode.save();
      }
      return res.status(400).json({ error: 'This code has expired' });
    }
    
    // Find the pet
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    
    // Get the theme
    const theme = await Theme.findById(redemptionCode.themeId);
    if (!theme || !theme.isActive) {
      return res.status(400).json({ error: 'The theme is no longer available' });
    }
    
    // Mark the code as redeemed
    redemptionCode.status = 'redeemed';
    redemptionCode.redeemedBy = petId;
    redemptionCode.redeemedAt = new Date();
    await redemptionCode.save();
    
    // Add theme to pet's purchased themes if not already owned
    const existingPurchase = await UserTheme.findOne({ 
      petId,
      themeId: theme._id
    });
    
    if (!existingPurchase) {
      await UserTheme.create({
        petId,
        themeId: theme._id,
        transactionDetails: {
          amount: theme.price,
          status: 'completed',
          transactionId: `REDEEM-${redemptionCode.code}`
        }
      });
    }
    
    // Apply the theme to the pet (optional - can be done separately)
    pet.themeId = theme._id;
    await pet.save();
    
    // Return success response with theme details
    res.json({
      success: true,
      message: 'Theme redeemed successfully!',
      theme: {
        id: theme._id,
        name: theme.name,
        description: theme.description,
        imageUrl: theme.imageUrl
      },
      pet: {
        id: pet._id,
        name: pet.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get redemption history for a pet
 */
exports.getRedemptionHistory = async (req, res) => {
  try {
    const { petId } = req.params;
    
    if (!petId) {
      return res.status(400).json({ error: 'Pet ID is required' });
    }
    
    // Find all redemptions for this pet
    const redemptions = await ThemeRedemptionCode.find({ 
      redeemedBy: petId,
      status: 'redeemed'
    }).populate('themeId');
    
    const formattedRedemptions = redemptions.map(r => ({
      code: r.code,
      redeemedAt: r.redeemedAt,
      expiresAt: r.expiresAt,
      theme: {
        id: r.themeId._id,
        name: r.themeId.name,
        description: r.themeId.description,
        imageUrl: r.themeId.imageUrl
      }
    }));
    
    res.json(formattedRedemptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Validate a code without redeeming it
 */
exports.validateCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({ error: 'Redemption code is required' });
    }
    
    // Find the redemption code
    const redemptionCode = await ThemeRedemptionCode.findOne({ 
      code: code.toUpperCase() 
    }).populate('themeId');
    
    if (!redemptionCode) {
      return res.status(404).json({ error: 'Invalid redemption code' });
    }
    
    // Check status
    if (redemptionCode.status === 'redeemed') {
      return res.status(400).json({ 
        valid: false,
        error: 'This code has already been redeemed',
        status: 'redeemed' 
      });
    }
    
    // Check if expired
    if (redemptionCode.status === 'expired' || new Date() > redemptionCode.expiresAt) {
      return res.status(400).json({ 
        valid: false,
        error: 'This code has expired',
        status: 'expired' 
      });
    }
    
    // Valid code - return theme info
    res.json({
      valid: true,
      code: redemptionCode.code,
      expiresAt: redemptionCode.expiresAt,
      theme: {
        id: redemptionCode.themeId._id,
        name: redemptionCode.themeId.name,
        description: redemptionCode.themeId.description,
        imageUrl: redemptionCode.themeId.imageUrl
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 