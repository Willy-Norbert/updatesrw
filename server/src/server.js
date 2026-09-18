require('dotenv').config();
const env = require('./config/env');
const prisma = require('./config/db');
const app = require('./app');

async function start() {
  await prisma.$connect();
  const server = app.listen(env.port, () => {
    console.log(`Updaterw API listening on http://localhost:${env.port}`);
    console.log(`Cloudinary: ${env.cloudinaryEnabled ? 'enabled' : 'local disk fallback'}`);
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

// Vercel provides the serverless listener — do not call app.listen there.
if (!process.env.VERCEL) {
  start().catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
}

module.exports = app;
