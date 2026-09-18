const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.statusCode || 500;
  let message = err.message || 'Unexpected server error';
  let errors = err.errors || null;

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    errors = err.issues || err.errors;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      const fields = err.meta && err.meta.target ? err.meta.target.join(', ') : 'field';
      message = `A record with this ${fields} already exists`;
    } else if (err.code === 'P2025') {
      status = 404;
      message = 'Resource not found';
    } else {
      status = 400;
      message = 'Database request failed';
    }
  } else if (err.name === 'MulterError') {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File is too large';
    else if (err.code === 'LIMIT_FILE_COUNT') message = 'Too many files';
    else message = err.message;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Invalid or expired token';
  }

  if (status >= 500 && env.isProd) {
    message = 'Unexpected server error';
    errors = null;
  }

  if (!env.isProd && status >= 500) {
    console.error(err);
  }

  return res.status(status).json({
    success: false,
    message,
    errors,
  });
}

module.exports = errorHandler;
