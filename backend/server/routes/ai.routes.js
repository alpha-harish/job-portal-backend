const express = require('express');

const { authMiddleware, requireRole } = require('../middleware/auth');
const { analyzeResume } = require('../controllers/ai.controller');

const router = express.Router();

router.post('/analyze-resume/:resumeId', authMiddleware, requireRole('seeker'), analyzeResume);

module.exports = router;
