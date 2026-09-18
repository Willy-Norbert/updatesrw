const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Updaterw API is running',
    configured: env.isConfigured,
    missing: env.missing,
    databaseLooksLocal: env.databaseLooksLocal,
  });
});

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Updaterw API',
    health: '/health',
    api: '/api',
    configured: env.isConfigured,
    missing: env.missing,
  });
});

app.use((req, res, next) => {
  if (env.isConfigured) return next();
  if (req.path === '/' || req.path === '/health') return next();
  return res.status(503).json({
    success: false,
    message: 'Server is missing required environment variables on Vercel.',
    missing: env.missing,
    hint: 'Add DATABASE_URL (hosted Postgres, not localhost), JWT_SECRET, and JWT_REFRESH_SECRET in the Vercel project settings, then redeploy.',
  });
});

if (env.isConfigured) {
  const apiRoutes = require('./routes');
  app.use('/api', apiRoutes);
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
