// models/Theme.js
// Mongoose schema for storing theme metadata

const mongoose = require('mongoose');

const ThemeSchema = new mongoose.Schema({
  _id: { type: String, required: true },            // Unique identifier, e.g., "pastel-vibes"
  name: { type: String, required: true },           // Human-readable name, e.g., "Pastel Vibes"
  description: { type: String, default: '' },       // Short description of the theme
  price: { type: Number, required: true, min: 0 },  // Cost in cents (0 = free)
  category: {                                       // Theme category for filtering
    type: String,
    enum: ['free', 'premium', 'bundle'],
    default: 'free'
  },
  previewUrl: { type: String, required: true },     // URL to the thumbnail image
  manifestUrl: { type: String, required: true },    // URL to manifest JSON with asset paths
  createdAt: { type: Date, default: Date.now },     // Timestamp of creation
  updatedAt: { type: Date, default: Date.now }      // Timestamp of last update
});

// Update `updatedAt` on each save
ThemeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Theme', ThemeSchema);
