/* -------------------------------------------------------------------------- */
/*  src/server.js – FULL SOURCE                                               */
/* -------------------------------------------------------------------------- */
require('dotenv').config();
const path         = require('path');
const fs           = require('fs');
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const bodyParser   = require('body-parser');
const mongoose     = require('mongoose');

/* ---------- route groups -------------------------------------------------- */
const commonRoutes = require('./routes/common');
const authRoutes   = require('./routes/auth');
const adminRoutes  = require('./routes/admin');
const userRoutes   = require('./routes/user');
const storeRoutes  = require('./routes/store');          //  <-- thêm
const themeStoreRoutes = require('./routes/themeStore'); // <-- new theme store routes
const { startReminderJob } = require('./utils/scheduler');

/* ========================================================================== */
/*  APP FACTORY                                                               */
/* ========================================================================== */
const createApp = () => {
  const app = express();

  /* ---------- 1. Reverse-proxy header (Render / Heroku) ------------------- */
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

  /* ---------- 2. Security middlewares ------------------------------------- */
  app.use(
    helmet({
      /**  Nếu để mặc định, Chrome sẽ chặn ảnh do header
       *   `Cross-Origin-Resource-Policy: same-origin`.
       *   Chúng ta cho phép cross-origin đối với file tĩnh.                 */
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,   // 1 phút
      max     : 100,         // 100 req / IP / phút
    }),
  );
  app.use(cookieParser());

  /* ---------- 3. CORS ----------------------------------------------------- */
  const allowedOrigins = (process.env.CORS_WHITELIST || '')
    .split(',')
    .filter(Boolean)
    .concat(['http://localhost:3000']);

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials   : true,
      methods       : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  /* ---------- 4. Body parsers -------------------------------------------- */
  app.use(bodyParser.json({ limit: '2mb' }));
  app.use(bodyParser.urlencoded({ extended: false }));

  /* ---------- 5. MongoDB & GridFS ---------------------------------------- */
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser   : true,
    useUnifiedTopology: true,
  });
  mongoose.connection.once('open', () => {
    /* Bucket `avatars` cho upload ảnh đại diện thú cưng                     */
    app.locals.gfsBucket = new mongoose.mongo.GridFSBucket(
      mongoose.connection.db,
      { bucketName: 'avatars' },
    );
    console.log('MongoDB connected');
  });

  /* ---------- 6. Static uploads (public/uploads/*) ----------------------- */
  const uploadsPath = path.join(__dirname, '..', 'public', 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  /* ---------- 7. REST API ------------------------------------------------- */
  app.use('/api/v1/auth',   authRoutes);      // đăng nhập admin
  app.use('/api/v1/admin',  adminRoutes);     // dashboard – cần token
  app.use('/api/v1/store',  storeRoutes);     // cửa hàng theme – public
  app.use('/api/v1/theme-store', themeStoreRoutes); // new theme store route
  app.use('/api/v1',        userRoutes);      // người quét QR – public
  app.use('/api/v1',        commonRoutes);    // tiện ích chung

  /* ---------- 8. (Optional) Serve React build ---------------------------- */
  const distPath  = path.join(__dirname, '..', 'dist');
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(distPath));
    /* SPA fallback                                                          */
    app.get('/*', (_req, res) => res.sendFile(indexHtml));
    console.log('[SERVER] Serving React build from /dist');
  } else {
    console.warn('[SERVER] No /dist folder – skipping front-end static serving.');
  }

  /* ---------- 9. Healthcheck -------------------------------------------- */
  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

  /* ---------- 10. Error handler ----------------------------------------- */
  // eslint-disable-next-line
  app.use((err, req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      stack  : process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  });

  return app;
};

/* ========================================================================== */
/*  START (when invoked directly)                                             */
/* ========================================================================== */
if (require.main === module) {
  const app  = createApp();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀  Server listening on ${PORT}`));
  startReminderJob();
}

module.exports = createApp;
