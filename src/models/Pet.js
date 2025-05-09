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

// Không cần thiết phải xóa index owner.email nữa, loại bỏ việc drop index
// PetSchema.index({ 'owner.email': 1 }, { unique: false }); // Nếu bạn muốn có index, thêm lại
// Pet.collection.dropIndex('owner.email_1').catch(err => {
//   if (err.code !== 26) { // Ignore error if index doesn't exist
//     console.error('Error dropping index:', err);
//   }
// });

const Pet = mongoose.model('Pet', PetSchema);

module.exports = Pet;
