// src/models/Pet.js
const mongoose = require('mongoose');

const VaccinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
  },
  { _id: false },
);

const ReExaminationSchema = new mongoose.Schema(
  {
    date        : { type: Date, required: true },
    note        : { type: String, default: '' },
    reminderSent: { type: Boolean, default: false },
  },
  { _id: false },
);

const PetSchema = new mongoose.Schema(
  {
    qrCodeUrl   : { type: String, required: true },
    qrToken     : { type: String, unique: true, sparse: true },
    avatarFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    themeId     : { type: mongoose.Schema.Types.ObjectId, ref: 'Theme', default: null },

    status: {
      type   : String,
      enum   : ['unused', 'active'],
      default: 'unused',
    },

    lastScannedAt: { type: Date, default: null },

    info: {
      name       : { type: String, default: '' },
      species    : { type: String, default: '' },
      birthDate  : { type: Date, default: null },
      description: { type: String, default: '' },
    },

    owner: {
      name : { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '', lowercase: true, trim: true },
    },

    allergicInfo: {
      substances: {
        type: [String],
        default: [],
        validate: [
          {
            validator(arr) {
              return arr.every(
                (s) => typeof s === 'string' && /^[\p{L} ]{1,10}$/u.test(s),
              );
            },
            message: 'Allergy names ≤ 10 ký tự, chỉ chữ + khoảng trắng.',
          },
        ],
      },
      note: { type: String, default: '' },
    },

    vaccinations  : { type: [VaccinationSchema], default: [] },
    reExaminations: { type: [ReExaminationSchema], default: [] },
  },
  { timestamps: true },
);

function computeStatus(doc) {
  const hasInfo =
    doc.info?.name ||
    doc.owner?.name ||
    doc.owner?.phone ||
    doc.owner?.email;
  doc.status = hasInfo ? 'active' : 'unused';
}

PetSchema.pre('save', function (next) {
  computeStatus(this);
  next();
});

PetSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.$set) computeStatus(update.$set);
  next();
});

module.exports = mongoose.model('Pet', PetSchema);
