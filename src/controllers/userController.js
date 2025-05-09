// src/controllers/userController.js
const Pet = require('../models/Pet');

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

exports.updatePet = async (req, res) => {
  try {
    const { info = {}, owner = {}, vaccinations = [] } = req.body;

    // Chuyển chuỗi ngày tháng thành Date object
    const parsedVaccinations = vaccinations.map(v => ({
      name: v.name,
      date: v.date ? new Date(v.date) : null
    })).filter(v => v.name && v.date);

    // Nếu có birthDate, parse thành Date
    if (info.birthDate) {
      info.birthDate = new Date(info.birthDate);
    }

    const updateData = {
      info,
      owner,
      vaccinations: parsedVaccinations
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
