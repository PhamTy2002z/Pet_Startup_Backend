//src/controllers/authController.js
const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'username & password required' });

  const admin = await Admin.findOne({ username });
  if (!admin || !(await admin.comparePassword(password)))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: admin._id, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );
  res.json({ token });
};
