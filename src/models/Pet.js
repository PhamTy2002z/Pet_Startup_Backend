const mongoose = require('mongoose');

const VaccinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true }
}, { _id: false });

const PetSchema = new mongoose.Schema({
  qrCodeUrl:     { type: String, required: true },
  avatarFileId:  { type: mongoose.Schema.Types.ObjectId, default: null },
  info: {
    name:      { type: String, default: '' },
    species:   { type: String, default: '' },
    birthDate: { type: Date,   default: null }
  },
  owner: {
    name:  { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '', unique: true, lowercase: true, trim: true } // Added email field
  },
  vaccinations: { type: [VaccinationSchema], default: [] },
  revisitDate: { type: Date, default: null } // Added revisitDate field
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('Pet', PetSchema);
