// src/models/UserTheme.js
const mongoose = require('mongoose');

const UserThemeSchema = new mongoose.Schema(
  {
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      required() {
        return !this.themeStoreUserId;
      },
    },

    themeStoreUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThemeStoreUser',
      required() {
        return !this.petId;
      },
    },

    themeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theme',
      required: true,
    },

    purchaseDate: { type: Date, default: Date.now },

    transactionDetails: {
      transactionId: {
        type: String,
        default: () =>
          `${Math.random().toString(36).slice(2)}${Math.random()
            .toString(36)
            .slice(2)}`,
      },
      amount: { type: Number, required: true, min: 0 },
      status: {
        type: String,
        enum: ['completed', 'pending', 'failed'],
        default: 'completed',
      },
    },
  },
  { timestamps: true },
);

UserThemeSchema.pre('validate', function (next) {
  if (!this.petId && !this.themeStoreUserId) {
    this.invalidate(
      'petId',
      'Either petId or themeStoreUserId must be provided',
    );
    this.invalidate(
      'themeStoreUserId',
      'Either petId or themeStoreUserId must be provided',
    );
  }
  next();
});

UserThemeSchema.index(
  { petId: 1, themeId: 1 },
  { unique: true, partialFilterExpression: { petId: { $exists: true } } },
);

UserThemeSchema.index(
  { themeStoreUserId: 1, themeId: 1 },
  {
    unique: true,
    partialFilterExpression: { themeStoreUserId: { $exists: true } },
  },
);

module.exports = mongoose.model('UserTheme', UserThemeSchema);
