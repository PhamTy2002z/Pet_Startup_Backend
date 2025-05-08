// src/controllers/adminController.js
const Pet = require('../models/Pet');
const { generateQRCode } = require('../utils/qr');

exports.createPet = async (req, res) => {
  try {
    // 1) Tạo document mới, bỏ qua validation lần đầu để không lỗi required qrCodeUrl
    const pet = new Pet();
    await pet.save({ validateBeforeSave: false });

    // 2) Sinh URL edit + QR
    const editUrl   = `${process.env.BASE_URL}/user/edit/${pet._id}`;
    const qrDataUri = await generateQRCode(editUrl);

    // 3) Cập nhật lại qrCodeUrl chính xác (lần này validation sẽ pass)
    pet.qrCodeUrl = qrDataUri;
    await pet.save();

    return res.status(201).json(pet);
  } catch (err) {
    console.error('Error in createPet:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getAllPets = async (req, res) => {
  try {
    const pets = await Pet.find().sort({ createdAt: -1 });
    return res.json(pets);
  } catch (err) {
    console.error('Error in getAllPets:', err);
    return res.status(500).json({ error: err.message });
  }
};
