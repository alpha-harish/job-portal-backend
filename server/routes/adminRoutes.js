const express = require('express');

const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/test', authMiddleware, requireRole('recruiter'), (req, res) => {
  return res.status(200).json({
    message: 'Admin route accessed successfully',
    user: req.user,
  });
});

module.exports = router;
