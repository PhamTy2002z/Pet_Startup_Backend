const mongoose = require('mongoose');

const UserThemeSchema = new mongoose.Schema({
  // petId is now optional since we can have theme store users
  petId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pet',
    required: function() {
      return !this.themeStoreUserId; // Required if themeStoreUserId is not provided
    }
  },
  
  // New field for theme store users
  themeStoreUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ThemeStoreUser',
    required: function() {
      return !this.petId; // Required if petId is not provided
    }
  },
  
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

// Custom validator to ensure either petId or themeStoreUserId is provided
UserThemeSchema.pre('validate', function(next) {
  if (!this.petId && !this.themeStoreUserId) {
    this.invalidate('petId', 'Either petId or themeStoreUserId must be provided');
    this.invalidate('themeStoreUserId', 'Either petId or themeStoreUserId must be provided');
  }
  next();
});

// Updated indexes to ensure unique purchases
UserThemeSchema.index({ petId: 1, themeId: 1 }, { 
  unique: true,
  partialFilterExpression: { petId: { $exists: true } }
});

UserThemeSchema.index({ themeStoreUserId: 1, themeId: 1 }, { 
  unique: true,
  partialFilterExpression: { themeStoreUserId: { $exists: true } }
});

module.exports = mongoose.model('UserTheme', UserThemeSchema);
