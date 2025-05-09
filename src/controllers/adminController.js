// src/controllers/adminController.js
const Pet = require('../models/Pet');
const { generateQRCode } = require('../utils/qr');

// Helper function to validate and get base URL
function getBaseUrl() {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error('BASE_URL environment variable is not set');
  }
  // Remove trailing slash if exists
  return baseUrl.replace(/\/$/, '');
}

exports.createPet = async (req, res) => {
  try {
    console.log('Creating new pet...');
    // 1) Tạo document mới, bỏ qua validation lần đầu để không lỗi required qrCodeUrl
    const pet = new Pet();
    await pet.save({ validateBeforeSave: false });
    console.log('Initial pet document created with ID:', pet._id);

    // 2) Sinh URL edit + QR
    const baseUrl = getBaseUrl();
    const editUrl = `${baseUrl}/user/edit/${pet._id}`;
    console.log('Environment variables:', {
      BASE_URL: baseUrl,
      NODE_ENV: process.env.NODE_ENV
    });
    console.log('Generating QR code for URL:', editUrl);
    const qrDataUri = await generateQRCode(editUrl);

    // 3) Cập nhật lại qrCodeUrl chính xác (lần này validation sẽ pass)
    pet.qrCodeUrl = qrDataUri;
    await pet.save();
    console.log('Pet document updated with QR code');

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

// Hàm mới: tạo hàng loạt pets + QR
exports.createBulkPets = async (req, res) => {
  const { quantity } = req.body;
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'quantity phải là số nguyên >= 1' });
  }

  try {
    const baseUrl = getBaseUrl();
    const pets = [];
    for (let i = 0; i < quantity; i++) {
      // Tạo document rỗng trước
      let pet = new Pet();
      await pet.save({ validateBeforeSave: false });

      // Sinh URL edit + QR
      const editUrl = `${baseUrl}/user/edit/${pet._id}`;
      console.log('Generating QR code for URL:', editUrl); // Debug log
      const qrDataUri = await generateQRCode(editUrl);

      // Cập nhật qrCodeUrl
      pet.qrCodeUrl = qrDataUri;
      await pet.save();

      pets.push(pet);
    }
    return res.status(201).json(pets);
  } catch (err) {
    console.error('Error in createBulkPets:', err);
    return res.status(500).json({ error: err.message });
  }
};
