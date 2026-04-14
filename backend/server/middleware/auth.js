const jwt = require('jsonwebtoken');

const AppError = require('../utils/AppError');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Not authorized', 401));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError('Not authorized', 401));
  }

  if (!process.env.JWT_SECRET) {
    return next(new AppError('Server error', 500));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const { id, role } = decoded || {};
  if (!id || !role) {
    return next(new AppError('Not authorized', 401));
  }

  const user = await User.findById(id).select('isBlocked').lean();
  if (!user) {
    return next(new AppError('Not authorized', 401));
  }

  if (user.isBlocked) {
    return next(new AppError('Account blocked', 403));
  }

  req.user = { id, role };
  return next();
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Not authorized', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Access denied', 403));
    }

    return next();
  };
};

module.exports = {
  authMiddleware,
  requireRole,
};
