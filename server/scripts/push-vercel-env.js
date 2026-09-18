/**
 * Push selected .env keys to Vercel production.
 * Usage: node scripts/push-vercel-env.js
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const values = {};
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  if (!line || line.trim().startsWith('#')) continue;
  const idx = line.indexOf('=');
  if (idx < 0) continue;
  const key = line.slice(0, idx).trim();
  let value = line.slice(idx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  values[key] = value;
}

const KEYS = [
  'DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'JWT_EXPIRES_IN', 'JWT_REFRESH_EXPIRES_IN',
  'CLIENT_URL', 'SERVER_URL', 'NODE_ENV',
  'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'CLOUDINARY_FOLDER',
  'MAIL_FROM', 'SMTP_USER', 'SMTP_PASS',
  'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET',
];

// Force production API URL for the deployed project.
values.SERVER_URL = values.SERVER_URL_VERCEL || 'https://updatesrwtech.vercel.app';
values.NODE_ENV = 'production';

if (/localhost|127\.0\.0\.1/.test(values.DATABASE_URL || '')) {
  console.warn('WARNING: DATABASE_URL is localhost — API will start but DB routes will fail.');
  console.warn('Replace with a Neon/Supabase connection string, then re-run this script.\n');
}

for (const key of KEYS) {
  const value = values[key];
  if (value === undefined || value === '') {
    console.log(`skip ${key}`);
    continue;
  }
  const result = spawnSync(
    'npx',
    ['vercel', 'env', 'add', key, 'production', '--value', value, '--yes', '--force'],
    { cwd: ROOT, encoding: 'utf8', shell: true }
  );
  if (result.status === 0) console.log(`ok ${key}`);
  else {
    console.log(`fail ${key}`);
    console.log(`${result.stderr || ''}${result.stdout || ''}`.slice(0, 300));
  }
}

console.log('\nDone. Redeploy with: npx vercel --prod');
