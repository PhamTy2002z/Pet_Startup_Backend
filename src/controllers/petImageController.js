const mongoose = require('mongoose');
const multer   = require('multer');
const Pet      = require('../models/Pet');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/* ---------- Upload avatar ---------- */
exports.uploadAvatar = [
  upload.single('avatar'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const bucket = req.app.locals.gfsBucket;
    const pet    = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Pet not found' });

    /* remove old avatar */
    if (pet.avatarFileId) {
      try { await bucket.delete(pet.avatarFileId); } catch (_) {}
    }

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });
    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async () => {
      pet.avatarFileId = uploadStream.id;
      await pet.save();
      res.json(pet);
    });
    uploadStream.on('error', (err) => res.status(500).json({ error: err.message }));
  },
];

/* ---------- Stream avatar ---------- */
exports.getAvatar = (req, res) => {
  try {
    const id     = new mongoose.Types.ObjectId(req.params.id);
    const bucket = req.app.locals.gfsBucket;
    bucket.openDownloadStream(id).on('error', () => res.sendStatus(404)).pipe(res);
  } catch {
    res.status(400).end();
  }
};
