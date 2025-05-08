// src/controllers/userController.js
const Pet = require('../models/Pet');

exports.getPetById = async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  if (!pet) return res.sendStatus(404);
  res.json(pet);
};

exports.updatePet = async (req, res) => {
  const { info, owner, vaccinations } = req.body;
  const pet = await Pet.findByIdAndUpdate(
    req.params.id,
    { info, owner, vaccinations },
    { new: true }
  );
  if (!pet) return res.sendStatus(404);
  res.json(pet);
};
