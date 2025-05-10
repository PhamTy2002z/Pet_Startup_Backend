const mongoose = require('mongoose');

// Schema cho lịch tiêm chủng
const VaccinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true }
}, { _id: false });

// Schema cho lịch tái khám
const ReExaminationSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  note: { type: String, default: '' }
}, { _id: false });

// Schema chính cho Pet
const PetSchema = new mongoose.Schema({
  qrCodeUrl:     { type: String, required: true },
  avatarFileId:  { type: mongoose.Schema.Types.ObjectId, default: null },
  status:        { 
    type: String, 
    enum: ['unused', 'scanned', 'active'],
    default: 'unused'
  },
  lastScannedAt: { type: Date, default: null },
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
  allergicInfo: { // Thay đổi từ 'allergicPerson' sang 'allergicInfo'
    substances: { type: [String], default: [] }, // Danh sách các chất gây dị ứng (ví dụ: lông mèo, thức ăn, v.v.)
    note: { type: String, default: '' } // Ghi chú về dị ứng
  },
  vaccinations: { type: [VaccinationSchema], default: [] },
  reExaminations: { type: [ReExaminationSchema], default: [] }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Middleware to automatically update status based on information
PetSchema.pre('save', function(next) {
  // If this is a new document, keep status as 'unused'
  if (this.isNew) {
    return next();
  }

  // Check if any information has been saved
  const hasInfo = this.info.name || this.owner.name || this.owner.phone || this.owner.email;
  
  // If QR has been scanned and information is saved, set status to 'active'
  if (this.lastScannedAt && hasInfo) {
    this.status = 'active';
  }
  // If QR has been scanned but no information saved, set status to 'scanned'
  else if (this.lastScannedAt && !hasInfo) {
    this.status = 'scanned';
  }
  // If QR hasn't been scanned yet, keep status as 'unused'
  else if (!this.lastScannedAt) {
    this.status = 'unused';
  }

  next();
});

// Không cần thiết phải xóa index owner.email nữa, loại bỏ việc drop index
// PetSchema.index({ 'owner.email': 1 }, { unique: false }); // Nếu bạn muốn có index, thêm lại
// Pet.collection.dropIndex('owner.email_1').catch(err => {
//   if (err.code !== 26) { // Ignore error if index doesn't exist
//     console.error('Error dropping index:', err);
//   }
// });

const Pet = mongoose.model('Pet', PetSchema);

module.exports = Pet;
