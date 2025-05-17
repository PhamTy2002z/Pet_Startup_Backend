require('dotenv').config();
const path       = require('path');
const fs         = require('fs');
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');

const commonRoutes = require('./routes/common');
const authRoutes   = require('./routes/auth');
const adminRoutes  = require('./routes/admin');
const userRoutes   = require('./routes/user');
const { startReminderJob } = require('./utils/scheduler');

const createApp = () => {
  const app = express();

  /* ---------- 1. Trust proxy (Render, Heroku…) ---------- */
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

  /* ---------- 2. Security ---------- */
  app.use(helmet());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 phút
      max     : 100,       // 100 req/IP/phút
    }),
  );
  app.use(cookieParser());

  /* ---------- 3. CORS ---------- */
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
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  /* ---------- 4. Parsers ---------- */
  app.use(bodyParser.json({ limit: '2mb' }));
  app.use(bodyParser.urlencoded({ extended: false }));

  /* ---------- 5. MongoDB & GridFS ---------- */
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser   : true,
    useUnifiedTopology: true,
  });
  mongoose.connection.once('open', () => {
    app.locals.gfsBucket = new mongoose.mongo.GridFSBucket(
      mongoose.connection.db,
      { bucketName: 'avatars' },
    );
    console.log('MongoDB connected');
  });

  /* ---------- 6. Static uploads ---------- */
  app.use('/uploads', express.static(path.join(__dirname, '..', 'public')));

  /* ---------- 7. API routes ---------- */
  app.use('/api/v1/auth',   authRoutes);
  app.use('/api/v1/admin',  adminRoutes);
  app.use('/api/v1',        userRoutes);
  app.use('/api/v1',        commonRoutes);

  /* ---------- 8. Optional React build ---------- */
  const distPath  = path.join(__dirname, '..', 'dist');
  const indexPath = path.join(distPath, 'index.html');
  const hasFrontend = fs.existsSync(indexPath);

  if (hasFrontend) {
    app.use(express.static(distPath));
    // SPA fallback
    app.get('/*', (_req, res) => res.sendFile(indexPath));
    console.log('[SERVER] Serving React build from /dist');
  } else {
    console.warn('[SERVER] No /dist folder – skipping front-end static serving.');
  }

  /* ---------- 9. Health check ---------- */
  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

  /* ---------- 10. Error handler ---------- */
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

/* ---------- 11. Start server (if run directly) ---------- */
if (require.main === module) {
  const app  = createApp();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀  Server listening on ${PORT}`));
  startReminderJob();
}

module.exports = createApp;
