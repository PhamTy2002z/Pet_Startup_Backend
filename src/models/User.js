// src/models/User.js
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name:   String,
  phone:  String,
  email:  String
  // …
});
module.exports = mongoose.model('User', UserSchema);
