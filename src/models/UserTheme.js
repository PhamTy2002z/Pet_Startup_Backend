const mongoose = require('mongoose');

const UserThemeSchema = new mongoose.Schema({
  petId  : { type: mongoose.Schema.Types.ObjectId, ref: 'Pet',   required: true },
  themeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theme', required: true },

  purchaseDate: { type: Date, default: Date.now },

  transactionDetails: {
    transactionId: {
      type: String,
      default: () =>
        `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
    },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
  },
}, { timestamps: true });

/* Mỗi pet chỉ mua 1 lần / theme */
UserThemeSchema.index({ petId: 1, themeId: 1 }, { unique: true });

module.exports = mongoose.model('UserTheme', UserThemeSchema);
