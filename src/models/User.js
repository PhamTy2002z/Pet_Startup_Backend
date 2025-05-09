// src/models/User.js
const mongoose = require('mongoose');

// Regular expression for validating email format
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: [emailRegex, 'Please provide a valid email address.'] 
  }
  // Add other fields as needed
});

module.exports = mongoose.model('User', UserSchema);
