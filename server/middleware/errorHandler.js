const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Server error' : error.message || 'Server error';
    error = new AppError(message, statusCode);
  }

  if (err && err.name === 'CastError') {
    error = new AppError('Invalid ID', 400);
  }

  if (err && err.code === 11000) {
    const isApplicationDuplicate =
      err.keyPattern && err.keyPattern.user && err.keyPattern.job;

    if (isApplicationDuplicate) {
      error = new AppError('Already applied', 409);
    } else {
      error = new AppError('Duplicate field value', 409);
    }
  }

  if (err && err.name === 'ValidationError') {
    const firstKey = err.errors && Object.keys(err.errors)[0];
    const firstMessage = firstKey && err.errors[firstKey] && err.errors[firstKey].message;
    error = new AppError(firstMessage || 'Validation error', 400);
  }

  if (err && err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  if (err && err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  if (err && (err.code === 'LIMIT_FILE_SIZE' || err.message === 'File too large')) {
    error = new AppError('File too large', 400);
  }

  if (err && err.message === 'Only PDF files allowed') {
    error = new AppError('Only PDF files allowed', 400);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && (error.statusCode || 500) === 500) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server error',
  });
};

module.exports = errorHandler;
