const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const securityMiddleware = (req, res, next) => {
  helmet()(req, res, () => {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const origin =
      nodeEnv === 'production'
        ? process.env.CLIENT_URL
        : '*';

    cors({ origin })(req, res, () => {
      express.json({ limit: '10kb' })(req, res, next);
    });
  });
};

module.exports = securityMiddleware;
