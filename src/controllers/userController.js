const Pet = require('../models/Pet');

// Lấy thông tin Pet theo ID
exports.getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
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
    const { info = {}, owner = {}, vaccinations = [], revisitDate = null } = req.body;

    // Chuyển chuỗi ngày tháng thành Date object
    const parsedVaccinations = vaccinations.map(v => ({
      name: v.name,
      date: v.date ? new Date(v.date) : null
    })).filter(v => v.name && v.date);

    // Nếu có birthDate, parse thành Date
    if (info.birthDate) {
      info.birthDate = new Date(info.birthDate);
    }

    // Nếu có revisitDate, parse thành Date
    if (revisitDate) {
      revisitDate = new Date(revisitDate);
    }

    const updateData = {
      info,
      owner,
      vaccinations: parsedVaccinations,
      revisitDate: revisitDate || null // Update revisitDate if provided
    };

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
        context: 'query'
      }
    );

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
