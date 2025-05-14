const mongoose = require('mongoose');

// Schema cho lịch tiêm chủng
const VaccinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true }
}, { _id: false });

// Schema cho lịch tái khám
const ReExaminationSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  note: { type: String, default: '' },
  reminderSent: { type: Boolean, default: false } // Track whether a reminder has been sent
}, { _id: false });

// Schema chính cho Pet
const PetSchema = new mongoose.Schema({
  qrCodeUrl:     { type: String, required: true },
  avatarFileId:  { type: mongoose.Schema.Types.ObjectId, default: null },
  status:        { 
    type: String, 
    enum: ['unused', 'active'],
    default: 'unused'
  },
  info: {
    name:      { type: String, default: '' },
    species:   { type: String, default: '' },
    birthDate: { type: Date,   default: null },
    description: { type: String, default: '' }
  },
  owner: {
    name:  { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true, trim: true }
  },
  allergicInfo: { // Thay đổi từ 'allergicPerson' sang 'allergicInfo'
    substances: { 
      type: [String], 
      default: [], 
      validate: [{
        validator: function(arr) {
          // Each substance must be a string with only letters and spaces, up to 10 chars
          return arr.every(s => typeof s === 'string' && /^[\p{L} ]{1,10}$/u.test(s));
        },
        message: 'Each allergy name must be up to 10 characters and can only contain letters and spaces.'
      }]
    }, // Danh sách các chất gây dị ứng (ví dụ: lông mèo, thức ăn, v.v.)
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
  
  // Update status based on whether information exists
  this.status = hasInfo ? 'active' : 'unused';

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
