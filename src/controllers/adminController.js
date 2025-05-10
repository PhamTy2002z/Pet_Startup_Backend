// src/controllers/adminController.js
const Pet = require('../models/Pet');
const { generateQRCode } = require('../utils/qr');
const mongoose = require('mongoose');

// Helper function to validate and get base URL
function getBaseUrl() {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error('BASE_URL environment variable is not set');
  }

  // Kiểm tra và thêm giao thức https:// nếu thiếu
  if (!/^https?:\/\//i.test(baseUrl)) {
    return `https://${baseUrl}`;  // Mặc định dùng https nếu không có giao thức
  }

  return baseUrl.replace(/\/$/, '');  // Remove trailing slash if exists
}

exports.createPet = async (req, res) => {
  try {
    console.log('Creating new pet...');
    // 1) Tạo document mới, bỏ qua validation lần đầu để không lỗi required qrCodeUrl
    const pet = new Pet();
    await pet.save({ validateBeforeSave: false });
    console.log('Initial pet document created with ID:', pet._id);

    // 2) Sinh URL edit + QR
    const baseUrl = getBaseUrl();  // Sử dụng getBaseUrl để lấy base URL chính xác
    const editUrl = `${baseUrl}/user/edit/${pet._id}`;  // Đảm bảo URL đến trang chỉnh sửa pet có prefix '/user'
    console.log('Environment variables:', {
      BASE_URL: baseUrl,
      NODE_ENV: process.env.NODE_ENV
    });
    console.log('Generating QR code for URL:', editUrl);
    const qrDataUri = await generateQRCode(editUrl);  // Sinh mã QR từ URL

    // 3) Cập nhật lại qrCodeUrl chính xác (lần này validation sẽ pass)
    pet.qrCodeUrl = qrDataUri;
    await pet.save();
    console.log('Pet document updated with QR code');

    return res.status(201).json(pet);  // Trả về kết quả
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
    const baseUrl = getBaseUrl();  // Lấy baseUrl chính xác
    const pets = [];
    for (let i = 0; i < quantity; i++) {
      // Tạo document rỗng trước
      let pet = new Pet();
      await pet.save({ validateBeforeSave: false });

      // Sinh URL edit + QR
      const editUrl = `${baseUrl}/user/edit/${pet._id}`;  // Thêm '/user' vào URL
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

exports.searchPets = async (req, res) => {
  try {
    const {
      id,
      petName,
      ownerName,
      phone,
      createdAtStart,
      createdAtEnd,
      updatedAtStart,
      updatedAtEnd,
      sortBy,
      sortOrder = 'asc',
      status
    } = req.query;

    // Build query object
    const query = {};

    // Search by ID if provided
    if (id) {
      try {
        query._id = new mongoose.Types.ObjectId(id);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }
    }

    // Search by pet name
    if (petName) {
      query['info.name'] = { $regex: petName, $options: 'i' };
    }

    // Search by owner name
    if (ownerName) {
      query['owner.name'] = { $regex: ownerName, $options: 'i' };
    }

    // Search by phone
    if (phone) {
      query['owner.phone'] = { $regex: phone, $options: 'i' };
    }

    // Enhanced status filtering
    if (status) {
      if (status === 'active') {
        // For active status, check if any information exists
        query.$or = [
          { 'info.name': { $ne: '' } },
          { 'owner.name': { $ne: '' } },
          { 'owner.phone': { $ne: '' } },
          { 'owner.email': { $ne: '' } },
          { 'info.species': { $ne: '' } },
          { 'info.birthDate': { $ne: null } },
          { 'allergicInfo.substances': { $ne: [] } },
          { 'allergicInfo.note': { $ne: '' } },
          { 'vaccinations': { $ne: [] } },
          { 'reExaminations': { $ne: [] } }
        ];
      } else if (status === 'unused') {
        // For unused status, check if no information exists
        query.$and = [
          { 'info.name': '' },
          { 'owner.name': '' },
          { 'owner.phone': '' },
          { 'owner.email': '' },
          { 'info.species': '' },
          { 'info.birthDate': null },
          { 'allergicInfo.substances': [] },
          { 'allergicInfo.note': '' },
          { 'vaccinations': [] },
          { 'reExaminations': [] }
        ];
      }
    }

    // Date range filters
    if (createdAtStart || createdAtEnd) {
      query.createdAt = {};
      if (createdAtStart) {
        query.createdAt.$gte = new Date(createdAtStart);
      }
      if (createdAtEnd) {
        query.createdAt.$lte = new Date(createdAtEnd);
      }
    }

    if (updatedAtStart || updatedAtEnd) {
      query.updatedAt = {};
      if (updatedAtStart) {
        query.updatedAt.$gte = new Date(updatedAtStart);
      }
      if (updatedAtEnd) {
        query.updatedAt.$lte = new Date(updatedAtEnd);
      }
    }

    // Build sort object based on sortBy parameter
    let sort = {};
    const order = sortOrder.toLowerCase() === 'desc' ? -1 : 1;

    switch (sortBy) {
      case 'petName':
        // Sort by pet name, then by creation date for stability
        sort = {
          'info.name': order,
          'createdAt': -1
        };
        break;
      
      case 'ownerName':
        // Sort by owner name, then by pet name for multi-level sort
        sort = {
          'owner.name': order,
          'info.name': order
        };
        break;
      
      case 'lastUpdated':
        // Sort by last updated date, then by creation date for stability
        sort = {
          'updatedAt': -1,
          'createdAt': -1
        };
        break;
      
      default:
        // Default sort by creation date (newest first)
        sort = { 'createdAt': -1 };
    }

    // Execute search with sorting
    const pets = await Pet.find(query).sort(sort);

    // Calculate 24 hours ago timestamp
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Add detailed information to each pet
    const petsWithDetails = pets.map(pet => {
      const petObj = pet.toObject();
      
      // Add recentlyUpdated flag
      petObj.recentlyUpdated = pet.updatedAt >= twentyFourHoursAgo;

      // Add detailed status information
      petObj.statusDetails = {
        hasPetInfo: Boolean(pet.info.name || pet.info.species || pet.info.birthDate),
        hasOwnerInfo: Boolean(pet.owner.name || pet.owner.phone || pet.owner.email),
        hasMedicalInfo: Boolean(
          pet.allergicInfo.substances.length > 0 ||
          pet.allergicInfo.note ||
          pet.vaccinations.length > 0 ||
          pet.reExaminations.length > 0
        )
      };

      return petObj;
    });

    // Get status counts
    const statusCounts = {
      total: pets.length,
      active: pets.filter(pet => pet.status === 'active').length,
      unused: pets.filter(pet => pet.status === 'unused').length
    };

    return res.json({
      count: pets.length,
      statusCounts,
      pets: petsWithDetails,
      sort: {
        by: sortBy || 'createdAt',
        order: sortOrder
      }
    });

  } catch (err) {
    console.error('Error in searchPets:', err);
    return res.status(500).json({ error: err.message });
  }
};

// New function to record QR scan
exports.recordQRScan = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pet = await Pet.findById(id);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    // Update last scanned timestamp
    pet.lastScannedAt = new Date();
    await pet.save(); // The pre-save middleware will automatically update the status

    return res.json(pet);
  } catch (err) {
    console.error('Error in recordQRScan:', err);
    return res.status(500).json({ error: err.message });
  }
};
