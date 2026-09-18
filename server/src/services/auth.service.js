const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { privateUser } = require('../utils/serializers');
const {
  signAccessToken,
  hashToken,
  createRawToken,
  refreshExpiryDate,
  verifyRefreshToken,
} = require('../utils/tokens');
const { issueOtp, verifyOtp } = require('./otp.service');
const { sendOtpEmail, sendWelcomeEmail } = require('./mail.service');

const REFRESH_COOKIE = 'refreshToken';

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: refreshExpiryDate(),
  };
}

async function issueTokens(user, res) {
  const rawRefresh = createRawToken();
  const tokenHash = hashToken(rawRefresh);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: refreshExpiryDate(),
    },
  });
  const accessToken = signAccessToken(user);
  res.cookie(REFRESH_COOKIE, rawRefresh, cookieOptions());
  return { accessToken, refreshToken: rawRefresh, user: privateUser(user) };
}

async function register(payload, res) {
  const email = payload.email.toLowerCase();
  const username = payload.username.toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    if (existing.email === email) throw new ApiError(409, 'Email is already registered');
    throw new ApiError(409, 'Username is already taken');
  }

  const password = await bcrypt.hash(payload.password, 12);
  const user = await prisma.user.create({
    data: {
      username,
      fullName: payload.fullName,
      email,
      password,
      role: 'USER',
      emailVerified: false,
      onboardingCompleted: false,
    },
  });

  const otp = await issueOtp(email, 'VERIFY_EMAIL');
  await sendOtpEmail({ email, code: otp.code, purpose: 'VERIFY_EMAIL' });

  const auth = await issueTokens(user, res);
  return {
    ...auth,
    requiresEmailVerification: true,
    requiresOnboarding: true,
  };
}

async function login({ identifier, password }, res) {
  const value = identifier.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: value }, { username: value }] },
  });
  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');
  if (!user.password) {
    throw new ApiError(400, 'This account uses Google or GitHub. Continue with that provider.');
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  const auth = await issueTokens(updated, res);
  return {
    ...auth,
    requiresEmailVerification: !updated.emailVerified,
    requiresOnboarding: !updated.onboardingCompleted,
  };
}

async function refresh(rawToken, res) {
  if (!rawToken) throw new ApiError(401, 'Refresh token required');
  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!stored) throw new ApiError(401, 'Invalid refresh token');
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => {});
    throw new ApiError(401, 'Refresh token expired');
  }
  if (!stored.user.isActive) throw new ApiError(403, 'This account has been deactivated');

  try {
    verifyRefreshToken(rawToken);
  } catch {
    /* raw refresh tokens are opaque hashes */
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });
  return issueTokens(stored.user, res);
}

async function logout(rawToken, userId, res) {
  if (rawToken) {
    await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(rawToken) } });
  } else if (userId) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }
  const expired = { ...cookieOptions(), expires: new Date(0) };
  res.clearCookie(REFRESH_COOKIE, expired);
  res.clearCookie(REFRESH_COOKIE, { ...expired, path: '/api/auth' });
}

async function me(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');
  return privateUser(user);
}

async function resendVerification(user) {
  if (user.emailVerified) throw new ApiError(400, 'Email is already verified');
  const otp = await issueOtp(user.email, 'VERIFY_EMAIL');
  await sendOtpEmail({ email: user.email, code: otp.code, purpose: 'VERIFY_EMAIL' });
  return { email: user.email, expiresInMinutes: otp.expiresInMinutes };
}

async function verifyEmail(user, code) {
  if (user.emailVerified) return privateUser(user);
  await verifyOtp(user.email, 'VERIFY_EMAIL', code);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });
  sendWelcomeEmail(updated).catch((error) => console.error('Welcome email failed', error));
  return privateUser(updated);
}

async function forgotPassword(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user || !user.isActive) {
    return { sent: true, message: 'If that email exists, a reset code was sent.' };
  }
  const otp = await issueOtp(normalized, 'RESET_PASSWORD');
  await sendOtpEmail({ email: normalized, code: otp.code, purpose: 'RESET_PASSWORD' });
  return { sent: true, message: 'If that email exists, a reset code was sent.' };
}

async function resetPassword({ email, code, password }) {
  const normalized = String(email || '').trim().toLowerCase();
  await verifyOtp(normalized, 'RESET_PASSWORD', code);
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) throw new ApiError(404, 'Account not found');
  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  return { reset: true };
}

async function completeOnboarding(user, payload = {}) {
  const data = {
    onboardingCompleted: true,
  };
  if (payload.bio !== undefined) data.bio = String(payload.bio || '').slice(0, 500) || null;
  if (payload.emailNotifications !== undefined) data.emailNotifications = Boolean(payload.emailNotifications);
  if (payload.fullName) data.fullName = String(payload.fullName).trim().slice(0, 80);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
  });
  return privateUser(updated);
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  resendVerification,
  verifyEmail,
  forgotPassword,
  resetPassword,
  completeOnboarding,
  issueTokens,
  REFRESH_COOKIE,
};
