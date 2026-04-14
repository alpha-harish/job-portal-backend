const express = require('express');

const { authMiddleware, requireRole } = require('../middleware/auth');
const {
  getAdminAnalytics,
  getAdminJobsAnalytics,
  getRecruiterAnalytics,
} = require('../controllers/analyticsController');

const adminAnalyticsRoutes = express.Router();
const recruiterAnalyticsRoutes = express.Router();

adminAnalyticsRoutes.use(authMiddleware, requireRole('admin'));
adminAnalyticsRoutes.get('/analytics', getAdminAnalytics);
adminAnalyticsRoutes.get('/jobs/analytics', getAdminJobsAnalytics);

recruiterAnalyticsRoutes.use(authMiddleware, requireRole('recruiter'));
recruiterAnalyticsRoutes.get('/analytics', getRecruiterAnalytics);

module.exports = {
  adminAnalyticsRoutes,
  recruiterAnalyticsRoutes,
};
