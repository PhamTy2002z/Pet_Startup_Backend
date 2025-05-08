// src/models/Pet.js
const mongoose = require('mongoose');

const VaccinationSchema = new mongoose.Schema({
  name: String,
  date: Date
}, { _id: false });

const PetSchema = new mongoose.Schema({
  qrCodeUrl:     { type: String, required: true },
  avatarFileId:  { type: mongoose.Schema.Types.ObjectId, default: null },
  info: {
    name:    { type: String, default: '' },
    species: { type: String, default: '' },
    age:     { type: Number, default: 0 }
  },
  owner: {
    name:  { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  vaccinations: { type: [VaccinationSchema], default: [] }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('Pet', PetSchema);
