const mongoose = require('mongoose');

const ThemeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  imageUrl: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isPremium: { 
    type: Boolean, 
    default: false
  },
  price: { 
    type: Number, 
    default: 0,
    min: 0
  },
  inStore: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Theme = mongoose.model('Theme', ThemeSchema);

module.exports = Theme; 