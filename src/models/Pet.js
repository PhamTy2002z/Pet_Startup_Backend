// src/models/Pet.js
const mongoose = require('mongoose');

const VaccinationSchema = new mongoose.Schema({
  name: String,
  date: Date
});

const PetSchema = new mongoose.Schema({
  qrCodeUrl: String,      // link tới form edit
  info: {
    name: String,
    species: String,
    age: Number,
    // … các trường pet khác
  },
  owner: {
    name: String,
    phone: String,
    // … thông tin user chỉnh sửa
  },
  vaccinations: [VaccinationSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pet', PetSchema);
