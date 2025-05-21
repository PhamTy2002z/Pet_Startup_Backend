// src/controllers/themeController.js
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const Theme = require('../models/Theme');
const Pet = require('../models/Pet');
const UserTheme = require('../models/UserTheme');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = 'public/uploads/themes';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `theme-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith('image/')
      ? cb(null, true)
      : cb(new Error('Only image files')),
}).single('image');

exports.uploadThemeImage = (req, res, next) =>
  upload(req, res, (err) =>
    err ? res.status(400).json({ error: err.message }) : next(),
  );

exports.createTheme = async (req, res) => {
  const {
    name,
    presetKey,
    description = '',
    isActive = true,
    order = 0,
    isPremium = false,
    price = 0,
    inStore = true,
  } = req.body;

  if (!name || !presetKey || !req.file)
    return res.status(400).json({ error: 'name, presetKey & image required' });

  const theme = await Theme.create({
    name,
    presetKey: String(presetKey).toLowerCase(),
    description,
    isActive,
    order,
    isPremium,
    price: isPremium ? Number(price) || 0 : 0,
    inStore,
    imageUrl: `/uploads/themes/${req.file.filename}`,
  });

  res.status(201).json(theme);
};

exports.getAllThemes = async (_req, res) =>
  res.json(await Theme.find().sort({ order: 1, name: 1 }));

exports.getThemeById = async (req, res) => {
  const theme = await Theme.findById(req.params.id);
  if (!theme) return res.status(404).json({ error: 'Theme not found' });
  res.json(theme);
};

exports.updateTheme = async (req, res) => {
  const updates = {
    ...req.body,
    price: req.body.isPremium ? Number(req.body.price) || 0 : 0,
  };

  if (req.file) updates.imageUrl = `/uploads/themes/${req.file.filename}`;
  if (updates.presetKey)
    updates.presetKey = String(updates.presetKey).toLowerCase();

  Object.keys(updates).forEach(
    (k) => updates[k] === undefined && delete updates[k],
  );

  const theme = await Theme.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!theme) return res.status(404).json({ error: 'Theme not found' });
  res.json(theme);
};

exports.deleteTheme = async (req, res) => {
  const theme = await Theme.findById(req.params.id);
  if (!theme) return res.status(404).json({ error: 'Theme not found' });

  if (await Pet.exists({ themeId: theme._id }))
    return res.status(409).json({ error: 'Theme is being used by pets' });

  if (theme.imageUrl) {
    const imgPath = path.join(process.cwd(), 'public', theme.imageUrl);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  await theme.deleteOne();
  res.json({ message: 'Deleted' });
};

exports.batchUpdateThemeStatus = async (req, res) => {
  const ops = (req.body.themes || [])
    .filter((t) => t.id)
    .map((t) => ({
      updateOne: {
        filter: { _id: t.id },
        update: { isActive: !!t.isActive },
      },
    }));

  if (!ops.length) return res.status(400).json({ error: 'No updates' });

  await Theme.bulkWrite(ops);
  res.json({ message: 'Done' });
};

exports.updateThemeOrder = async (req, res) => {
  const ops = (req.body.themes || [])
    .filter((t) => t.id)
    .map((t) => ({
      updateOne: { filter: { _id: t.id }, update: { order: t.order } },
    }));

  if (!ops.length) return res.status(400).json({ error: 'No updates' });

  await Theme.bulkWrite(ops);
  res.json({ message: 'Done' });
};

exports.getStoreThemes = async (_req, res) =>
  res.json(
    await Theme.find({ isActive: true, inStore: true })
      .sort({ isPremium: 1, order: 1, name: 1 })
      .select('name imageUrl description price isPremium presetKey'),
  );

exports.getPurchasedThemes = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.petId))
    return res.status(400).json({ error: 'Invalid petId' });

  const list = await UserTheme.find({ petId: req.params.petId }).populate(
    'themeId',
  );

  res.json(
    list
      .filter((ut) => ut.themeId?.isActive)
      .map((ut) => ut.themeId)
      .filter(Boolean)
      .map((t) => ({
        _id: t._id,
        name: t.name,
        imageUrl: t.imageUrl,
        presetKey: t.presetKey,
        isPremium: t.isPremium,
        price: t.price,
        description: t.description,
      })),
  );
};

exports.purchaseTheme = async (req, res) => {
  const { petId, themeId } = req.body;
  if (!petId || !themeId)
    return res.status(400).json({ error: 'petId & themeId required' });

  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    const [pet, theme] = await Promise.all([
      Pet.findById(petId).session(session),
      Theme.findById(themeId).session(session),
    ]);

    if (!pet || !theme) throw new Error('Pet or Theme not found');
    if (!theme.isActive || !theme.inStore)
      throw new Error('Theme not for sale');

    const existed = await UserTheme.findOne({ petId, themeId }).session(
      session,
    );
    if (existed) throw new Error('Theme already purchased');

    await UserTheme.create(
      [
        {
          petId,
          themeId,
          transactionDetails: { amount: theme.price, status: 'completed' },
        },
      ],
      { session },
    );
  });

  session.endSession();
  res.status(201).json({ message: 'Purchased' });
};

exports.applyPurchasedTheme = async (req, res) => {
  const { petId, themeId } = req.body;
  if (!petId) return res.status(400).json({ error: 'petId required' });

  const pet = await Pet.findById(petId);
  if (!pet) return res.status(404).json({ error: 'Pet not found' });

  if (themeId) {
    const theme = await Theme.findById(themeId);
    if (!theme || !theme.isActive)
      return res.status(400).json({ error: 'Theme invalid' });

    if (theme.isPremium && !(await UserTheme.exists({ petId, themeId })))
      return res.status(403).json({ error: 'Theme not purchased' });

    pet.themeId = themeId;
  } else {
    pet.themeId = null;
  }

  await pet.save();

  res.json(await Pet.findById(petId).populate('themeId'));
};

exports.getActiveThemes = async (req, res) => {
  const { petId } = req.query;

  const free = await Theme.find({ isActive: true, isPremium: false })
    .sort({ order: 1, name: 1 })
    .lean();

  if (!petId) return res.json(free);

  const purchased = await UserTheme.find({ petId }).populate('themeId');

  const all = [
    ...free,
    ...purchased.map((u) => u.themeId).filter(Boolean),
  ];

  const uniq = Array.from(
    new Map(all.map((t) => [t._id.toString(), t])).values(),
  ).sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));

  res.json(uniq);
};
