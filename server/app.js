const express = require('express');

const securityMiddleware = require('./middleware/security');
const logger = require('./middleware/logger');
const rateLimiter = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const savedSearchRoutes = require('./routes/savedSearchRoutes');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(securityMiddleware);
app.use(logger);
app.use(rateLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/saved-searches', savedSearchRoutes);

app.all('*', (req, res, next) => {
  next(new AppError('Route not found', 404));
});

app.use(errorHandler);

module.exports = app;
