const Pet = require('../models/Pet');
const Theme = require('../models/Theme');

// Lấy thông tin Pet theo ID
exports.getPetById = async (req, res) => {
  console.log('getPetById called with ID:', req.params.id);
  try {
    const pet = await Pet.findById(req.params.id).populate('themeId');
    console.log('Pet found:', pet ? 'Yes' : 'No');
    if (!pet) return res.sendStatus(404);
    res.json(pet);
  } catch (err) {
    console.error('Error fetching pet:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cập nhật thông tin Pet (info, owner, vaccinations, revisitDate)
exports.updatePet = async (req, res) => {
  try {
    const { info = {}, owner = {}, vaccinations = [], reExaminations = [], allergicInfo = {} } = req.body;

    // Parse vaccination dates
    const parsedVaccinations = vaccinations.map(v => ({
      name: v.name,
      date: v.date ? new Date(v.date) : null
    })).filter(v => v.name && v.date);

    // Parse re-examination dates
    const parsedReExaminations = reExaminations.map(r => ({
      date: r.date ? new Date(r.date) : null,
      note: r.note || ''
    })).filter(r => r.date);

    // If there's birthDate, parse it
    if (info.birthDate) {
      info.birthDate = new Date(info.birthDate);
    }

    // Ensure description is included in the info object
    const updatedInfo = {
      ...info,
      description: info.description || ''
    };

    const updateData = {
      info: updatedInfo,
      owner,
      vaccinations: parsedVaccinations,
      reExaminations: parsedReExaminations,
      allergicInfo
    };

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
        context: 'query'
      }
    ).populate('themeId');

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    res.json(pet);
  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({
      message: 'Error updating pet',
      error: error.message
    });
  }
};

// Cập nhật email của chủ Pet
exports.updatePetOwnerEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Simple email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Cập nhật email của chủ Pet
    pet.owner.email = email;

    await pet.save();

    res.json({ message: 'Pet owner email updated successfully', pet });
  } catch (error) {
    console.error('Error updating owner email:', error);
    res.status(500).json({
      message: 'Error updating owner email',
      error: error.message
    });
  }
};

// Cập nhật thông tin dị ứng của pet
exports.updateAllergicInfo = async (req, res) => {
  try {
    const { substances, note } = req.body;

    // Kiểm tra xem pet có tồn tại không
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Cập nhật thông tin dị ứng cho pet
    pet.allergicInfo = {
      substances: substances || [],
      note: note || ''
    };

    await pet.save();

    res.json({
      message: 'Allergic information updated successfully',
      pet
    });
  } catch (error) {
    console.error('Error updating allergic information:', error);
    res.status(500).json({
      message: 'Error updating allergic information',
      error: error.message
    });
  }
};

// Cập nhật mô tả (description) của pet
exports.updatePetDescription = async (req, res) => {
  try {
    const { description } = req.body;

    // Kiểm tra xem pet có tồn tại không
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Cập nhật mô tả cho pet
    pet.info.description = description || '';

    await pet.save();

    res.json({
      message: 'Pet description updated successfully',
      pet
    });
  } catch (error) {
    console.error('Error updating pet description:', error);
    res.status(500).json({
      message: 'Error updating pet description',
      error: error.message
    });
  }
};

// Apply a theme to a pet
exports.applyThemeToPet = async (req, res) => {
  try {
    const { themeId } = req.body;
    const petId = req.params.id;
    
    // Find the pet
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    // If themeId is provided and not null, verify it exists and is active
    if (themeId) {
      const theme = await Theme.findById(themeId);
      if (!theme) {
        return res.status(404).json({ message: 'Theme not found' });
      }
      
      // Check if theme is active
      if (!theme.isActive) {
        return res.status(400).json({ message: 'This theme is not available' });
      }
      
      pet.themeId = themeId;
    } else {
      // If themeId is null, remove the theme
      pet.themeId = null;
    }
    
    await pet.save();
    
    // Return the updated pet with populated theme
    const updatedPet = await Pet.findById(petId).populate('themeId');
    
    return res.json({
      message: 'Theme applied successfully',
      pet: updatedPet
    });
  } catch (error) {
    console.error('Error applying theme to pet:', error);
    return res.status(500).json({
      message: 'Error applying theme',
      error: error.message
    });
  }
};

// Get all active themes
exports.getActiveThemes = async (req, res) => {
  try {
    const themes = await Theme.find({ isActive: true }).sort({ order: 1, name: 1 });
    return res.json(themes);
  } catch (error) {
    console.error('Error getting active themes:', error);
    return res.status(500).json({
      message: 'Error retrieving themes',
      error: error.message
    });
  }
};
