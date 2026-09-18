const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/tokens');
const prisma = require('../config/db');

function readAccessToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies && req.cookies.accessToken) return req.cookies.accessToken;
  return null;
}

async function loadUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) return null;
  return user;
}

async function authenticateUser(req, res, next) {
  try {
    const token = readAccessToken(req);
    if (!token) throw new ApiError(401, 'Authentication required');
    const payload = verifyAccessToken(token);
    const user = await loadUser(payload.sub);
    if (!user) throw new ApiError(401, 'Invalid or expired session');
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Invalid or expired token'));
    }
    next(error);
  }
}

async function optionalAuth(req, res, next) {
  try {
    const token = readAccessToken(req);
    if (!token) return next();
    const payload = verifyAccessToken(token);
    const user = await loadUser(payload.sub);
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
}

module.exports = { authenticateUser, optionalAuth };
