//src/models/User.js
const mongoose = require('mongoose');

const emailRegex = /^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const UserSchema = new mongoose.Schema({
  name : { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: {
    type   : String,
    required: true,
    unique : true,
    lowercase: true,
    trim  : true,
    match : [emailRegex, 'Invalid email'],
  },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
