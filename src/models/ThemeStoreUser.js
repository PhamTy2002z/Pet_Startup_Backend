//src/models/ThemeStoreUser.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emailRegex = /^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const ThemeStoreUserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [emailRegex, 'Invalid email'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
ThemeStoreUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
ThemeStoreUserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('ThemeStoreUser', ThemeStoreUserSchema); 