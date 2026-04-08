const mongoose = require('mongoose');

const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.id;

  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate('job', 'title company location salary')
    .populate('application', 'status createdAt');

  return res.status(200).json({ notifications });
});

const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.id;
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid ID', 400);
  }

  const notification = await Notification.findById(id);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.user.toString() !== userId) {
    throw new AppError('Access denied', 403);
  }

  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }

  return res.status(200).json({ success: true });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.id;

  const count = await Notification.countDocuments({ user: userId, isRead: false });

  return res.status(200).json({ count });
});

module.exports = {
  getNotifications,
  markAsRead,
  getUnreadCount,
};
