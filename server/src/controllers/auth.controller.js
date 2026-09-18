const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body, res);
  sendSuccess(res, { status: 201, message: 'Account created. Check your email for a verification code.', data });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body, res);
  sendSuccess(res, { message: 'Logged in successfully', data });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const data = await authService.refresh(token, res);
  sendSuccess(res, { message: 'Token refreshed', data });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  await authService.logout(token, req.user?.id, res);
  sendSuccess(res, { message: 'Logged out successfully', data: null });
});

const me = asyncHandler(async (req, res) => {
  const data = await authService.me(req.user.id);
  sendSuccess(res, { message: 'Authenticated user', data });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const data = await authService.verifyEmail(req.user, req.body.code);
  sendSuccess(res, { message: 'Email verified successfully', data });
});

const resendVerification = asyncHandler(async (req, res) => {
  const data = await authService.resendVerification(req.user);
  sendSuccess(res, { message: 'Verification code sent', data });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body.email);
  sendSuccess(res, { message: data.message, data });
});

const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  sendSuccess(res, { message: 'Password updated. You can log in now.', data });
});

const completeOnboarding = asyncHandler(async (req, res) => {
  const data = await authService.completeOnboarding(req.user, req.body);
  sendSuccess(res, { message: 'Onboarding completed', data });
});

const oauthService = require('../services/oauth.service');

const oauthStatus = asyncHandler(async (_req, res) => {
  sendSuccess(res, { message: 'OAuth providers', data: oauthService.oauthStatus() });
});

const oauthStart = asyncHandler(async (req, res) => {
  const url = oauthService.beginOAuth(req.params.provider, res);
  res.redirect(url);
});

const oauthCallback = asyncHandler(async (req, res) => {
  try {
    const url = await oauthService.finishOAuth(req.params.provider, req, res);
    res.redirect(url);
  } catch (error) {
    const message = encodeURIComponent(error.message || 'OAuth login failed');
    res.redirect(`${require('../config/env').clientUrl}/?oauthError=${message}`);
  }
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  completeOnboarding,
  oauthStatus,
  oauthStart,
  oauthCallback,
};
