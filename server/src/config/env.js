require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: required('DATABASE_URL'),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`,
  jwtSecret: required('JWT_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'updaterw',
  },
  uploads: {
    maxImageMb: Number(process.env.MAX_IMAGE_SIZE_MB || 5),
    maxVideoMb: Number(process.env.MAX_VIDEO_SIZE_MB || 80),
    maxProfileMb: Number(process.env.MAX_PROFILE_SIZE_MB || 3),
  },
  mail: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Updaterw <noreply@updaterw.local>',
  },
  oauth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    githubClientId: process.env.GITHUB_CLIENT_ID || '',
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  },
};

env.isProd = env.nodeEnv === 'production';
env.cloudinaryEnabled = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);
env.smtpEnabled = Boolean(env.mail.user && env.mail.pass);
env.googleAuthEnabled = Boolean(env.oauth.googleClientId && env.oauth.googleClientSecret);
env.githubAuthEnabled = Boolean(env.oauth.githubClientId && env.oauth.githubClientSecret);

module.exports = env;
