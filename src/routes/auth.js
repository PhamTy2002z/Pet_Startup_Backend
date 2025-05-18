//src/routes/auth.js
const express  = require('express');
const router   = express.Router();
const wrap     = require('../utils/asyncWrap');
const { loginAdmin } = require('../controllers/authController');

router.post('/login', wrap(loginAdmin));

module.exports = router;
