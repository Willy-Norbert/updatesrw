require('dotenv').config();
const env = require('./config/env');
const app = require('./app');

async function start() {
  if (env.isConfigured) {
    const prisma = require('./config/db');
    await prisma.$connect();
  }
  const server = app.listen(env.port, () => {
    console.log(`Updaterw API listening on http://localhost:${env.port}`);
    if (!env.isConfigured) {
      console.error(`Missing env: ${env.missing.join(', ')}`);
    } else {
      console.log(`Cloudinary: ${env.cloudinaryEnabled ? 'enabled' : 'local disk fallback'}`);
    }
  });
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${env.port} is already in use. Stop the other process or change PORT in .env.`);
    } else {
      console.error('Failed to start server', error);
    }
    process.exit(1);
  });
}

if (!process.env.VERCEL) {
  start().catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
}

module.exports = app;
