const rateLimit = require('express-rate-limit');

const nodeEnv = process.env.NODE_ENV || 'development';
const limit = nodeEnv === 'production' ? 1000 : 100;

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Too many requests',
    });
  },
});

module.exports = rateLimiter;
