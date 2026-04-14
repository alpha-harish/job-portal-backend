const mongoose = require('mongoose');

const Bookmark = require('../models/Bookmark');
const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const addBookmark = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.id;
  const { jobId } = req.body;

  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError('Invalid ID', 400);
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  const existing = await Bookmark.findOne({ user: userId, job: jobId });
  if (existing) {
    throw new AppError('Already bookmarked', 409);
  }

  try {
    await Bookmark.create({ user: userId, job: jobId });
  } catch (err) {
    if (err && err.code === 11000) {
      throw new AppError('Already bookmarked', 409);
    }
    throw err;
  }

  return res.status(201).json({
    success: true,
    message: 'Job bookmarked',
  });
});

const removeBookmark = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.id;
  const { jobId } = req.body;

  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError('Invalid ID', 400);
  }

  const bookmark = await Bookmark.findOne({ user: userId, job: jobId });
  if (!bookmark) {
    throw new AppError('Bookmark not found', 404);
  }

  if (bookmark.user.toString() !== userId) {
    throw new AppError('Access denied', 403);
  }

  await bookmark.deleteOne();

  return res.status(200).json({
    success: true,
    message: 'Bookmark removed',
  });
});

const getMyBookmarks = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.id;

  const bookmarks = await Bookmark.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate('job', 'title company location salary createdAt')
    .lean();

  return res.status(200).json({ bookmarks });
});

module.exports = {
  addBookmark,
  removeBookmark,
  getMyBookmarks,
};
