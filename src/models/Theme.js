//src/models/Theme.js
const mongoose = require('mongoose');

const ThemeSchema = new mongoose.Schema({
  name       : { type: String, required: true, trim: true },
  imageUrl   : { type: String, required: true },
  description: { type: String, default: '' },

  isActive : { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },

  price: {
    type: Number,
    default: 0,
    min: 0,
  },

  inStore: { type: Boolean, default: true },
  order  : { type: Number,  default: 0 },
}, { timestamps: true });

/* Nếu theme không premium => price = 0 */
ThemeSchema.pre('save', function (next) {
  if (!this.isPremium) this.price = 0;
  next();
});

/* index hữu ích cho cửa hàng */
ThemeSchema.index({ isActive: 1, inStore: 1, order: 1 });

module.exports = mongoose.model('Theme', ThemeSchema);
