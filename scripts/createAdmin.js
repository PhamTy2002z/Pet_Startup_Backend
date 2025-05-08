// scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const Admin    = require('../src/models/Admin');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const exists = await Admin.findOne({ username: 'admin' });
  if (!exists) {
    await Admin.create({ username: 'admin', password: 'Robertotaj1995' });
    console.log('Admin created');
  } else {
    console.log('Admin already exists');
  }
  process.exit();
})();