// src/controllers/authController.js
require('dotenv').config();      // nếu controller chạy standalone
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin || !(await admin.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('Missing JWT_SECRET!');
    return res.status(500).json({ error: 'Server config error' });
  }

  const token = jwt.sign(
    { adminId: admin._id, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
  res.json({ token });
};
