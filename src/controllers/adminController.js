// src/controllers/adminController.js
const Pet = require('../models/Pet');
const { generateQRCode } = require('../utils/qr');

exports.createPet = async (req, res) => {
  try {
    // tạo document rỗng trước để có _id
    let pet = new Pet();
    await pet.save();

    // form edit cho pet: BASE_URL/user/edit/{petId}
    const editUrl = `${process.env.BASE_URL}/user/edit/${pet._id}`;
    const qrDataUri = await generateQRCode(editUrl);

    // cập nhật trường qrCodeUrl
    pet.qrCodeUrl = qrDataUri;
    await pet.save();

    res.status(201).json(pet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllPets = async (req, res) => {
  const pets = await Pet.find().sort({ createdAt: -1 });
  res.json(pets);
};

// có thể thêm update/delete theo nhu cầu
