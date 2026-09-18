require('dotenv').config();

function read(name, fallback = '') {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return value;
}

function requiredNames() {
  return ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
}

const missing = requiredNames().filter((name) => !process.env[name]);

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: read('DATABASE_URL'),
  clientUrl: read('CLIENT_URL', 'http://localhost:5173'),
  serverUrl: read('SERVER_URL', `http://localhost:${process.env.PORT || 5000}`),
  jwtSecret: read('JWT_SECRET'),
  jwtRefreshSecret: read('JWT_REFRESH_SECRET'),
  jwtExpiresIn: read('JWT_EXPIRES_IN', '1h'),
  jwtRefreshExpiresIn: read('JWT_REFRESH_EXPIRES_IN', '7d'),
  cloudinary: {
    cloudName: read('CLOUDINARY_CLOUD_NAME'),
    apiKey: read('CLOUDINARY_API_KEY'),
    apiSecret: read('CLOUDINARY_API_SECRET'),
    folder: read('CLOUDINARY_FOLDER', 'updaterw'),
  },
  uploads: {
    maxImageMb: Number(process.env.MAX_IMAGE_SIZE_MB || 5),
    maxVideoMb: Number(process.env.MAX_VIDEO_SIZE_MB || 80),
    maxProfileMb: Number(process.env.MAX_PROFILE_SIZE_MB || 3),
  },
  mail: {
    user: read('SMTP_USER'),
    pass: read('SMTP_PASS'),
    from: read('MAIL_FROM', 'Updaterw <noreply@updaterw.local>'),
  },
  oauth: {
    googleClientId: read('GOOGLE_CLIENT_ID'),
    googleClientSecret: read('GOOGLE_CLIENT_SECRET'),
    githubClientId: read('GITHUB_CLIENT_ID'),
    githubClientSecret: read('GITHUB_CLIENT_SECRET'),
  },
  missing,
  isConfigured: missing.length === 0,
};

env.isProd = env.nodeEnv === 'production';
env.cloudinaryEnabled = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);
env.smtpEnabled = Boolean(env.mail.user && env.mail.pass);
env.googleAuthEnabled = Boolean(env.oauth.googleClientId && env.oauth.googleClientSecret);
env.githubAuthEnabled = Boolean(env.oauth.githubClientId && env.oauth.githubClientSecret);
env.databaseLooksLocal = /localhost|127\.0\.0\.1/.test(env.databaseUrl);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
}

module.exports = env;
