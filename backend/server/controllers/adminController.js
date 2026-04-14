const mongoose = require('mongoose');

const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const SavedSearch = require('../models/SavedSearch');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const parsePagination = (query) => {
  const pageNum = Math.max(1, Number(query.page) || 1);
  const parsedLimit = Number(query.limit);
  const limitNum = Math.min(50, Math.max(1, Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20));
  const skip = (pageNum - 1) * limitNum;

  return { pageNum, limitNum, skip };
};

const getAllUsers = asyncHandler(async (req, res) => {
  const { pageNum, limitNum, skip } = parsePagination(req.query);

  const totalUsers = await User.countDocuments();
  const totalPages = totalUsers === 0 ? 0 : Math.ceil(totalUsers / limitNum);

  if (totalPages !== 0 && pageNum > totalPages) {
    return res.status(200).json({
      users: [],
      totalUsers,
      totalPages,
      currentPage: pageNum,
    });
  }

  const users = await User.find({})
    .select('name email role isBlocked createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  return res.status(200).json({
    users,
    totalUsers,
    totalPages,
    currentPage: pageNum,
  });
});

const blockUser = asyncHandler(async (req, res) => {
  const adminId = req.user && req.user.id;
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid ID', 400);
  }

  if (String(id) === String(adminId)) {
    throw new AppError('Cannot block yourself', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role === 'admin') {
    throw new AppError('Cannot block an admin', 400);
  }

  user.isBlocked = true;
  await user.save();

  return res.status(200).json({ success: true });
});

const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid ID', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.isBlocked = false;
  await user.save();

  return res.status(200).json({ success: true });
});

const deleteUser = asyncHandler(async (req, res) => {
  const adminId = req.user && req.user.id;
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid ID', 400);
  }

  if (String(id) === String(adminId)) {
    throw new AppError('Cannot delete yourself', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role === 'admin') {
    throw new AppError('Cannot delete an admin', 400);
  }

  try {
    await Job.deleteMany({ createdBy: user._id });
  } catch (err) {
    // ignore
  }

  try {
    await Application.deleteMany({ user: user._id });
  } catch (err) {
    // ignore
  }

  try {
    await SavedSearch.deleteMany({ user: user._id });
  } catch (err) {
    // ignore
  }

  await user.deleteOne();

  return res.status(200).json({ success: true });
});

const changeUserRole = asyncHandler(async (req, res) => {
  const adminId = req.user && req.user.id;
  const { id } = req.params;
  const { role } = req.body || {};

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid ID', 400);
  }

  if (String(id) === String(adminId)) {
    throw new AppError('Cannot change your own role', 400);
  }

  const allowedRoles = ['seeker', 'recruiter', 'admin'];
  if (!role || !allowedRoles.includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role === 'admin') {
    throw new AppError('Cannot change role of an admin', 400);
  }

  user.role = role;
  await user.save();

  return res.status(200).json({ success: true });
});

const getAllJobs = asyncHandler(async (req, res) => {
  const { pageNum, limitNum, skip } = parsePagination(req.query);

  const totalJobs = await Job.countDocuments();
  const totalPages = totalJobs === 0 ? 0 : Math.ceil(totalJobs / limitNum);

  if (totalPages !== 0 && pageNum > totalPages) {
    return res.status(200).json({
      jobs: [],
      totalJobs,
      totalPages,
      currentPage: pageNum,
    });
  }

  const jobs = await Job.find({})
    .select('title company location salary createdAt createdBy')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('createdBy', 'name email')
    .lean();

  return res.status(200).json({
    jobs,
    totalJobs,
    totalPages,
    currentPage: pageNum,
  });
});

const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid ID', 400);
  }

  const job = await Job.findById(id);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  await job.deleteOne();

  return res.status(200).json({ success: true });
});

const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalRecruiters,
    totalSeekers,
    totalJobs,
    totalApplications,
    totalSavedSearches,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'recruiter' }),
    User.countDocuments({ role: 'seeker' }),
    Job.countDocuments(),
    Application.countDocuments(),
    SavedSearch.countDocuments(),
  ]);

  return res.status(200).json({
    totalUsers,
    totalRecruiters,
    totalSeekers,
    totalJobs,
    totalApplications,
    totalSavedSearches,
  });
});

module.exports = {
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUser,
  changeUserRole,
  getAllJobs,
  deleteJob,
  getAdminDashboard,
};
