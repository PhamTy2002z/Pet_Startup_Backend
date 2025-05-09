// src/controllers/userController.js
const Pet = require('../models/Pet');

exports.getPetById = async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  if (!pet) return res.sendStatus(404);
  res.json(pet);
};

exports.updatePet = async (req, res) => {
  try {
    const { info, owner, vaccinations } = req.body;
    
    // Ensure birthDate is properly handled if it exists in the info object
    if (info && info.birthDate) {
      info.birthDate = new Date(info.birthDate);
    }

    const updateData = {
      info: info || {},
      owner: owner || {},
      vaccinations: vaccinations || []
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
