//src/controllers/userController.js
const mongoose = require('mongoose');
const Pet      = require('../models/Pet');
const { recordQRScan } = require('./adminController');

/* ---------- Get ---------- */
exports.getPetById = async (req, res) => {
  const pet = await Pet.findById(req.params.id).populate('themeId');
  if (!pet) return res.status(404).end();
  res.json(pet);
};

/* ---------- Update all-in-one ---------- */
exports.updatePet = async (req, res) => {
  const { info = {}, owner = {}, vaccinations = [], reExaminations = [], allergicInfo = {} } = req.body;

  /* parse date fields */
  const parseDateArr = (arr) => arr
    .map((v) => ({ ...v, date: v.date ? new Date(v.date) : null }))
    .filter((v) => v.name ? v.date : v.date);

  if (info.birthDate) info.birthDate = new Date(info.birthDate);

  const pet = await Pet.findByIdAndUpdate(
    req.params.id,
    {
      info      : { ...info, description: info.description || '' },
      owner,
      vaccinations   : parseDateArr(vaccinations),
      reExaminations : parseDateArr(reExaminations),
      allergicInfo,
    },
    { new: true, runValidators: true },
  ).populate('themeId');
  if (!pet) return res.status(404).json({ message: 'Pet not found' });
  res.json(pet);
};

/* ---------- Owner email ---------- */
exports.updatePetOwnerEmail = async (req, res) => {
  const email = req.body.email?.trim();
  if (!email || !/^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email))
    return res.status(400).json({ message: 'Invalid email' });

  const pet = await Pet.findByIdAndUpdate(req.params.id, { 'owner.email': email }, { new: true });
  if (!pet) return res.status(404).json({ message: 'Pet not found' });
  res.json(pet);
};

/* ---------- Allergic info ---------- */
exports.updateAllergicInfo = async (req, res) => {
  const pet = await Pet.findByIdAndUpdate(
    req.params.id,
    { allergicInfo: { substances: req.body.substances || [], note: req.body.note || '' } },
    { new: true },
  );
  if (!pet) return res.status(404).json({ message: 'Pet not found' });
  res.json(pet);
};

/* ---------- Description ---------- */
exports.updatePetDescription = async (req, res) => {
  const pet = await Pet.findByIdAndUpdate(
    req.params.id,
    { 'info.description': req.body.description || '' },
    { new: true },
  );
  if (!pet) return res.status(404).json({ message: 'Pet not found' });
  res.json(pet);
};
