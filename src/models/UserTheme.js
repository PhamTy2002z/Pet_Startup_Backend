const mongoose = require('mongoose');

const UserThemeSchema = new mongoose.Schema({
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  themeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theme',
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  // We'll store transaction details here to simulate payments
  transactionDetails: {
    // Simple simulation of a payment transaction
    transactionId: {
      type: String,
      default: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'completed'
    }
  }
}, {
  timestamps: true
});

// Compound index to ensure a pet can purchase a theme only once
UserThemeSchema.index({ petId: 1, themeId: 1 }, { unique: true });

const UserTheme = mongoose.model('UserTheme', UserThemeSchema);

module.exports = UserTheme; 