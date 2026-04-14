const express = require('express');

const { getRecruiterDashboard } = require('../controllers/dashboardController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/recruiter', authMiddleware, requireRole('recruiter'), getRecruiterDashboard);

module.exports = router;
