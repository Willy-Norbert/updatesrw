const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const {
  registerBody,
  loginBody,
  otpBody,
  forgotBody,
  resetBody,
  onboardingBody,
} = require('../validators/auth.validator');
const { authenticateUser, optionalAuth } = require('../middleware/authenticate');

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post('/register', authLimiter, validate({ body: registerBody }), authController.register);
router.post('/login', authLimiter, validate({ body: loginBody }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', optionalAuth, authController.logout);
router.get('/me', authenticateUser, authController.me);
router.post('/verify-email', authenticateUser, authLimiter, validate({ body: otpBody }), authController.verifyEmail);
router.post('/resend-verification', authenticateUser, authLimiter, authController.resendVerification);
router.post('/forgot-password', authLimiter, validate({ body: forgotBody }), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: resetBody }), authController.resetPassword);
router.post('/onboarding', authenticateUser, validate({ body: onboardingBody }), authController.completeOnboarding);

router.get('/oauth/providers', authController.oauthStatus);
router.get('/google', authLimiter, (req, res, next) => {
  req.params.provider = 'google';
  return authController.oauthStart(req, res, next);
});
router.get('/google/callback', authLimiter, (req, res, next) => {
  req.params.provider = 'google';
  return authController.oauthCallback(req, res, next);
});
router.get('/github', authLimiter, (req, res, next) => {
  req.params.provider = 'github';
  return authController.oauthStart(req, res, next);
});
router.get('/github/callback', authLimiter, (req, res, next) => {
  req.params.provider = 'github';
  return authController.oauthCallback(req, res, next);
});

module.exports = router;
