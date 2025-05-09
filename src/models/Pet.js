const mongoose = require('mongoose');

const VaccinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true }
}, { _id: false });

const ReExaminationSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  note: { type: String, default: '' }
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
    email: { type: String, default: '', lowercase: true, trim: true }
  },
  vaccinations: { type: [VaccinationSchema], default: [] },
  reExaminations: { type: [ReExaminationSchema], default: [] }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Drop the unique index on owner.email if it exists
PetSchema.index({ 'owner.email': 1 }, { unique: false });

const Pet = mongoose.model('Pet', PetSchema);

// Drop the existing unique index
Pet.collection.dropIndex('owner.email_1').catch(err => {
  if (err.code !== 26) { // Ignore error if index doesn't exist
    console.error('Error dropping index:', err);
  }
});

module.exports = Pet;
