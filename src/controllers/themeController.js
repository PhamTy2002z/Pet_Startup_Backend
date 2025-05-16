const Theme = require('../models/Theme');
const Pet = require('../models/Pet');
const UserTheme = require('../models/UserTheme');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Set up multer storage for theme images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = 'public/uploads/themes';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'theme-' + uniqueSuffix + ext);
  }
});

// Set up file filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create multer upload instance
const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('image');

// Middleware for file upload
exports.uploadThemeImage = (req, res, next) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(400).json({ error: err.message });
    }

    // If a file was uploaded, add its path to req.body
    if (req.file) {
      req.body.imageUrl = `/uploads/themes/${req.file.filename}`;
    } 
    // Always call next(), whether a file was uploaded or not,
    // to allow the next handler (e.g., updateTheme) to proceed.
    next();
  });
};

// Create a new theme
exports.createTheme = async (req, res) => {
  try {
    const { name, description, isActive, order, isPremium, price, inStore } = req.body;
    const imageUrl = req.body.imageUrl;
    
    if (!name || !imageUrl) {
      return res.status(400).json({ error: 'Name and image are required' });
    }
    
    const theme = new Theme({
      name,
      imageUrl,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true,
      isPremium: isPremium !== undefined ? isPremium : false,
      price: isPremium ? (price || 0) : 0,
      inStore: inStore !== undefined ? inStore : true,
      order: order || 0
    });
    
    await theme.save();
    
    return res.status(201).json(theme);
  } catch (error) {
    console.error('Error creating theme:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Get all themes
exports.getAllThemes = async (req, res) => {
  try {
    const themes = await Theme.find().sort({ order: 1, name: 1 });
    return res.json(themes);
  } catch (error) {
    console.error('Error getting themes:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Get a single theme by ID
exports.getThemeById = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    return res.json(theme);
  } catch (error) {
    console.error('Error getting theme:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Update a theme
exports.updateTheme = async (req, res) => {
  try {
    const { name, description, isActive, order, isPremium, price, inStore } = req.body;
    const updates = {
      name,
      description,
      isActive,
      isPremium,
      price,
      inStore,
      order
    };
    
    // Add imageUrl to updates if a new image was uploaded
    if (req.body.imageUrl) {
      updates.imageUrl = req.body.imageUrl;
    }
    
    // Remove undefined fields
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
    
    const theme = await Theme.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    return res.json(theme);
  } catch (error) {
    console.error('Error updating theme:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Delete a theme
exports.deleteTheme = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check if the theme is being used by any pets
    const petsUsingTheme = await Pet.countDocuments({ themeId: req.params.id });
    
    if (petsUsingTheme > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete theme as it is being used by pets',
        petsCount: petsUsingTheme
      });
    }
    
    // Delete the theme image file if it exists
    if (theme.imageUrl) {
      const imagePath = path.join(process.cwd(), 'public', theme.imageUrl.replace(/^\/uploads/, 'uploads'));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await theme.deleteOne();
    
    return res.json({ message: 'Theme deleted successfully' });
  } catch (error) {
    console.error('Error deleting theme:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Assign theme to pet
exports.assignThemeToPet = async (req, res) => {
  try {
    const { petId, themeId } = req.body;
    
    if (!petId) {
      return res.status(400).json({ error: 'Pet ID is required' });
    }
    
    // Find the pet
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    
    // If themeId is provided, verify it exists
    if (themeId) {
      const theme = await Theme.findById(themeId);
      if (!theme) {
        return res.status(404).json({ error: 'Theme not found' });
      }
      pet.themeId = themeId;
    } else {
      // If no themeId is provided, remove the theme from the pet
      pet.themeId = null;
    }
    
    await pet.save();
    
    return res.json(pet);
  } catch (error) {
    console.error('Error assigning theme to pet:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Batch update theme active status
exports.batchUpdateThemeStatus = async (req, res) => {
  try {
    const { themes } = req.body;
    
    if (!themes || !Array.isArray(themes)) {
      return res.status(400).json({ error: 'Invalid themes data' });
    }
    
    const updates = [];
    
    // Process each theme update
    for (const item of themes) {
      if (!item.id) {
        continue;
      }
      
      updates.push({
        updateOne: {
          filter: { _id: item.id },
          update: { isActive: !!item.isActive }
        }
      });
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid theme updates found' });
    }
    
    // Execute bulk operation
    const result = await Theme.bulkWrite(updates);
    
    // Get updated themes
    const updatedThemes = await Theme.find({
      _id: { $in: themes.map(t => t.id) }
    }).sort({ order: 1, name: 1 });
    
    return res.json({
      message: 'Themes updated successfully',
      result: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      },
      themes: updatedThemes
    });
  } catch (error) {
    console.error('Error updating theme status:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Update theme order
exports.updateThemeOrder = async (req, res) => {
  try {
    const { themes } = req.body;
    
    if (!themes || !Array.isArray(themes)) {
      return res.status(400).json({ error: 'Invalid themes data' });
    }
    
    const updates = [];
    
    // Process each theme update
    for (const item of themes) {
      if (!item.id || typeof item.order !== 'number') {
        continue;
      }
      
      updates.push({
        updateOne: {
          filter: { _id: item.id },
          update: { order: item.order }
        }
      });
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid theme updates found' });
    }
    
    // Execute bulk operation
    const result = await Theme.bulkWrite(updates);
    
    // Get updated themes
    const updatedThemes = await Theme.find().sort({ order: 1, name: 1 });
    
    return res.json({
      message: 'Theme order updated successfully',
      result: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      },
      themes: updatedThemes
    });
  } catch (error) {
    console.error('Error updating theme order:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Get all themes available in store
exports.getStoreThemes = async (req, res) => {
  try {
    const themes = await Theme.find({ 
      isActive: true,
      inStore: true 
    }).sort({ isPremium: 1, order: 1, name: 1 });
    
    return res.json(themes);
  } catch (error) {
    console.error('Error getting store themes:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Get themes that a pet has purchased
exports.getPurchasedThemes = async (req, res) => {
  try {
    const { petId } = req.params;
    
    if (!petId) {
      return res.status(400).json({ error: 'Pet ID is required' });
    }
    
    // Find the pet
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    
    // Get all user themes for this pet
    const userThemes = await UserTheme.find({ petId })
      .populate('themeId')
      .sort({ purchaseDate: -1 });
    
    // Get only active themes
    const purchasedThemes = userThemes
      .filter(ut => ut.themeId && ut.themeId.isActive)
      .map(ut => ut.themeId);
    
    return res.json(purchasedThemes);
  } catch (error) {
    console.error('Error getting purchased themes:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Purchase a theme
exports.purchaseTheme = async (req, res) => {
  try {
    const { petId, themeId } = req.body;
    
    if (!petId || !themeId) {
      return res.status(400).json({ error: 'Pet ID and Theme ID are required' });
    }
    
    // Find the pet
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    
    // Find the theme
    const theme = await Theme.findById(themeId);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    
    // Check if theme is active and in store
    if (!theme.isActive || !theme.inStore) {
      return res.status(400).json({ error: 'This theme is not available for purchase' });
    }
    
    // Check if the theme is already purchased
    const existingPurchase = await UserTheme.findOne({ petId, themeId });
    if (existingPurchase) {
      return res.status(400).json({ error: 'You already own this theme' });
    }
    
    // Create a new purchase record
    const userTheme = new UserTheme({
      petId,
      themeId,
      transactionDetails: {
        amount: theme.price,
        status: 'completed'
      }
    });
    
    await userTheme.save();
    
    // Return the purchased theme with theme details
    const purchasedTheme = await UserTheme.findById(userTheme._id).populate('themeId');
    
    return res.status(201).json({
      message: 'Theme purchased successfully',
      purchase: purchasedTheme
    });
  } catch (error) {
    console.error('Error purchasing theme:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Apply a purchased theme to a pet
exports.applyPurchasedTheme = async (req, res) => {
  try {
    const { petId, themeId } = req.body;
    
    if (!petId) {
      return res.status(400).json({ error: 'Pet ID is required' });
    }
    
    // Find the pet
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    
    // If themeId is provided, verify it exists and user has purchased it
    if (themeId) {
      const theme = await Theme.findById(themeId);
      if (!theme) {
        return res.status(404).json({ error: 'Theme not found' });
      }
      
      // Check if theme is active
      if (!theme.isActive) {
        return res.status(400).json({ error: 'This theme is not available' });
      }
      
      // If premium theme, check if user has purchased it
      if (theme.isPremium) {
        const purchase = await UserTheme.findOne({ petId, themeId });
        if (!purchase) {
          return res.status(403).json({ error: 'You must purchase this premium theme before applying it' });
        }
      }
      
      pet.themeId = themeId;
    } else {
      // If no themeId is provided, remove the theme from the pet
      pet.themeId = null;
    }
    
    await pet.save();
    
    // Return the updated pet with theme details
    const updatedPet = await Pet.findById(petId).populate('themeId');
    
    return res.json({
      message: 'Theme applied successfully',
      pet: updatedPet
    });
  } catch (error) {
    console.error('Error applying theme to pet:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Get all active themes for the user (both free and purchased)
exports.getActiveThemes = async (req, res) => {
  try {
    const { petId } = req.query;
    
    if (!petId) {
      // Return just the free active themes if no pet ID is provided
      const freeThemes = await Theme.find({ 
        isActive: true, 
        isPremium: false 
      }).sort({ order: 1, name: 1 });
      
      return res.json(freeThemes);
    }
    
    // Find free themes
    const freeThemes = await Theme.find({ 
      isActive: true, 
      isPremium: false 
    });
    
    // Find pet's purchased themes
    const userThemes = await UserTheme.find({ petId }).populate('themeId');
    const purchasedThemes = userThemes
      .filter(ut => ut.themeId && ut.themeId.isActive)
      .map(ut => ut.themeId);
    
    // Combine both sets of themes and remove duplicates
    const allThemes = [...freeThemes, ...purchasedThemes];
    const uniqueThemes = Array.from(new Map(allThemes.map(theme => [theme._id.toString(), theme])).values());
    
    // Sort themes by order and name
    uniqueThemes.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.name.localeCompare(b.name);
    });
    
    return res.json(uniqueThemes);
  } catch (error) {
    console.error('Error getting active themes:', error);
    return res.status(500).json({ error: error.message });
  }
}; 