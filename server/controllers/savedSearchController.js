const mongoose = require('mongoose');

const SavedSearch = require('../models/SavedSearch');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const createSavedSearch = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.id;

  const { search, location, company, minSalary, maxSalary } = req.body || {};

  const minSalaryNum = minSalary !== undefined ? Number(minSalary) : undefined;
  const maxSalaryNum = maxSalary !== undefined ? Number(maxSalary) : undefined;

  if (minSalaryNum !== undefined && Number.isNaN(minSalaryNum)) {
    throw new AppError('Invalid minSalary', 400);
  }

  if (maxSalaryNum !== undefined && Number.isNaN(maxSalaryNum)) {
    throw new AppError('Invalid maxSalary', 400);
  }

  await SavedSearch.create({
    user: userId,
    search: search || undefined,
    location: location || undefined,
    company: company || undefined,
    minSalary: minSalaryNum,
    maxSalary: maxSalaryNum,
    lastCheckedAt: new Date(),
  });

  return res.status(201).json({ success: true });
});

const getSavedSearches = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.id;

  const searches = await SavedSearch.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({ searches });
});

const deleteSavedSearch = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.id;
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid ID', 400);
  }

  const savedSearch = await SavedSearch.findById(id);
  if (!savedSearch) {
    throw new AppError('Saved search not found', 404);
  }

  if (savedSearch.user.toString() !== userId) {
    throw new AppError('Access denied', 403);
  }

  await savedSearch.deleteOne();

  return res.status(200).json({ success: true });
});

module.exports = {
  createSavedSearch,
  getSavedSearches,
  deleteSavedSearch,
};
