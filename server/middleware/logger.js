const morgan = require('morgan');

const logger = (req, res, next) => {
  const format = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
  return morgan(format)(req, res, next);
};

module.exports = logger;
