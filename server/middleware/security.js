const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const securityMiddleware = (req, res, next) => {
  helmet()(req, res, () => {
    cors()(req, res, () => {
      express.json({ limit: '10kb' })(req, res, next);
    });
  });
};

module.exports = securityMiddleware;
