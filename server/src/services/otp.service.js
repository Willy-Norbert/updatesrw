const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

async function issueOtp(email, purpose) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) throw new ApiError(400, 'Email is required');

  await prisma.otpCode.updateMany({
    where: { email: normalized, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.otpCode.create({
    data: {
      email: normalized,
      codeHash,
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  return { email: normalized, code, expiresInMinutes: 10 };
}

async function verifyOtp(email, purpose, code) {
  const normalized = String(email || '').trim().toLowerCase();
  const value = String(code || '').trim();
  if (!/^\d{6}$/.test(value)) throw new ApiError(400, 'Enter the 6-digit code');

  const record = await prisma.otpCode.findFirst({
    where: { email: normalized, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new ApiError(400, 'No active code found. Request a new one.');
  if (record.expiresAt < new Date()) throw new ApiError(400, 'This code has expired. Request a new one.');
  if (record.attempts >= MAX_ATTEMPTS) throw new ApiError(429, 'Too many attempts. Request a new code.');

  const match = await bcrypt.compare(value, record.codeHash);
  if (!match) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new ApiError(400, 'Invalid verification code');
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  return true;
}

module.exports = { issueOtp, verifyOtp, generateOtp };
