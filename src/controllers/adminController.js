const mongoose  = require('mongoose');
const Pet       = require('../models/Pet');
const { generateQRCode } = require('../utils/qr');
const { getBaseUrl }    = require('../utils/url');

/* ---------- Helpers ---------- */
const buildPetEditUrl = (petId) => `${getBaseUrl()}/user/edit/${petId}`;

/* ---------- Create one ---------- */
exports.createPet = async (req, res) => {
  // 1. tạo ID trước
  const _id = new mongoose.Types.ObjectId();
  const qr  = await generateQRCode(buildPetEditUrl(_id));
  // 2. save 1 lần
  const pet = await Pet.create({ _id, qrCodeUrl: qr });
  return res.status(201).json(pet);
};

/* ---------- Bulk ---------- */
exports.createBulkPets = async (req, res) => {
  const qty = Number(req.body.quantity);
  if (!Number.isInteger(qty) || qty < 1)
    return res.status(400).json({ error: 'quantity must be integer >=1' });

  const pets = await Promise.all(
    Array.from({ length: qty }).map(async () => {
      const _id = new mongoose.Types.ObjectId();
      const qr  = await generateQRCode(buildPetEditUrl(_id));
      return { _id, qrCodeUrl: qr };
    }),
  );
  const inserted = await Pet.insertMany(pets);
  res.status(201).json(inserted);
};

/* ---------- Get all ---------- */
exports.getAllPets = async (_req, res) => {
  const pets = await Pet.find().sort({ createdAt: -1 }).populate('themeId').lean();
  res.json(pets);
};

/* ---------- Search ---------- */
exports.searchPets = async (req, res) => {
  const q = {};                          // build query
  const {
    id, petName, ownerName, phone,
    createdAtStart, createdAtEnd,
    updatedAtStart, updatedAtEnd,
    sortBy, sortOrder = 'asc',
    status,
  } = req.query;

  /* id */
  if (id) {
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid ID' });
    q._id = id;
  }
  /* like filters */
  if (petName)   q['info.name']   = { $regex: petName,   $options: 'i' };
  if (ownerName) q['owner.name']  = { $regex: ownerName, $options: 'i' };
  if (phone)     q['owner.phone'] = { $regex: phone,     $options: 'i' };

  /* status <-> trống/không trống */
  if (status === 'active') {
    q.$or = [
      { 'info.name': { $ne: '' } },
      { 'owner.name': { $ne: '' } },
      { 'owner.phone': { $ne: '' } },
      { 'owner.email': { $ne: '' } },
    ];
  }
  if (status === 'unused') {
    q.$and = [
      { 'info.name': '' },
      { 'owner.name': '' },
      { 'owner.phone': '' },
      { 'owner.email': '' },
    ];
  }

  /* date range */
  if (createdAtStart || createdAtEnd) {
    q.createdAt = {};
    if (createdAtStart) q.createdAt.$gte = new Date(createdAtStart);
    if (createdAtEnd)   q.createdAt.$lte = new Date(createdAtEnd);
  }
  if (updatedAtStart || updatedAtEnd) {
    q.updatedAt = {};
    if (updatedAtStart) q.updatedAt.$gte = new Date(updatedAtStart);
    if (updatedAtEnd)   q.updatedAt.$lte = new Date(updatedAtEnd);
  }

  /* sort */
  const dir = sortOrder.toLowerCase() === 'desc' ? -1 : 1;
  const sort = ({
    petName     : { 'info.name': dir, createdAt: -1 },
    ownerName   : { 'owner.name': dir, 'info.name': dir },
    lastUpdated : { updatedAt: -1, createdAt: -1 },
  })[sortBy] || { createdAt: -1 };

  /* query */
  const pets = await Pet.find(q).sort(sort).populate('themeId').lean();

  /* extra info */
  const twentyFour = Date.now() - 24 * 60 * 60 * 1000;
  const mapped = pets.map((p) => ({
    ...p,
    recentlyUpdated: p.updatedAt >= twentyFour,
    statusDetails  : {
      hasPetInfo   : Boolean(p.info?.name || p.info?.species || p.info?.birthDate),
      hasOwnerInfo : Boolean(p.owner?.name || p.owner?.phone || p.owner?.email),
    },
  }));
  res.json({ count: mapped.length, pets: mapped });
};

/* ---------- QR scan ---------- */
exports.recordQRScan = async (req, res) => {
  const pet = await Pet.findByIdAndUpdate(
    req.params.id,
    { lastScannedAt: new Date() },
    { new: true },
  );
  if (!pet) return res.status(404).json({ error: 'Pet not found' });
  res.json(pet);
};
