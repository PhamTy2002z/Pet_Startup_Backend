const mongoose = require('mongoose');
const crypto = require('crypto');

const ThemeRedemptionCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(8).toString('hex').toUpperCase()
  },
  themeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theme',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ThemeStoreUser',
    required: true
  },
  redeemedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'redeemed', 'expired'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    default: () => {
      const now = new Date();
      return new Date(now.setMonth(now.getMonth() + 6)); // Codes expire after 6 months
    }
  },
  redeemedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster lookups
ThemeRedemptionCodeSchema.index({ code: 1 });
ThemeRedemptionCodeSchema.index({ createdBy: 1 });
ThemeRedemptionCodeSchema.index({ redeemedBy: 1 });
ThemeRedemptionCodeSchema.index({ status: 1 });

module.exports = mongoose.model('ThemeRedemptionCode', ThemeRedemptionCodeSchema); 