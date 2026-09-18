const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, username: user.username },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function signRefreshToken(user, tokenId) {
  return jwt.sign({ sub: user.id, tid: tokenId }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function createRawToken() {
  return crypto.randomBytes(40).toString('hex');
}

function refreshExpiryDate() {
  const match = String(env.jwtRefreshExpiresIn).match(/^(\d+)([dhms])$/i);
  const now = Date.now();
  if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return new Date(now + amount * (multipliers[unit] || 86400000));
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  createRawToken,
  refreshExpiryDate,
};
