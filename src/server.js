// src/server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const bodyParser = require('body-parser');
const connectDB  = require('./config/db');

const app = express();
connectDB();

app.use(cors());
app.use(bodyParser.json());

// mount route
app.use('/api/admin', require('./routes/admin'));
app.use('/api/user',  require('./routes/user'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
