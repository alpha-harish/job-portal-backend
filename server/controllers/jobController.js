const mongoose = require('mongoose');

const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const createJob = asyncHandler(async (req, res) => {
  const { title, description, company, location, salary } = req.body;

  if (!title || !description || !company || !location) {
    throw new AppError('Missing required fields', 400);
  }

  const createdBy = req.user && req.user.id;
  if (!createdBy) {
    throw new AppError('Not authorized', 401);
  }

  const job = await Job.create({
    title,
    description,
    company,
    location,
    salary,
    createdBy,
  });

  return res.status(201).json({ job });
});

const getAllJobs = asyncHandler(async (req, res) => {
  const {
    keyword,
    location,
    company,
    minSalary,
    maxSalary,
    page,
    limit,
    sort,
  } = req.query;

  const filter = {};

  if (keyword) {
    filter.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { company: { $regex: keyword, $options: 'i' } },
    ];
  }

  if (location) {
    filter.location = { $regex: location, $options: 'i' };
  }

  if (company) {
    filter.company = { $regex: company, $options: 'i' };
  }

  const minSalaryNum = Number(minSalary);
  const maxSalaryNum = Number(maxSalary);
  if (!Number.isNaN(minSalaryNum) || !Number.isNaN(maxSalaryNum)) {
    filter.salary = {};
    if (!Number.isNaN(minSalaryNum)) {
      filter.salary.$gte = minSalaryNum;
    }
    if (!Number.isNaN(maxSalaryNum)) {
      filter.salary.$lte = maxSalaryNum;
    }
  }

  const sortMap = {
    latest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    salary_asc: { salary: 1 },
    salary_desc: { salary: -1 },
  };
  const sortOption = sortMap[sort] || sortMap.latest;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 10);
  const skip = (pageNum - 1) * limitNum;

  const totalJobs = await Job.countDocuments(filter);
  const totalPages = totalJobs === 0 ? 0 : Math.ceil(totalJobs / limitNum);

  if (totalPages !== 0 && pageNum > totalPages) {
    return res.status(200).json({
      jobs: [],
      totalJobs,
      totalPages,
      currentPage: pageNum,
    });
  }

  const jobs = await Job.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum)
    .populate('createdBy', 'name email');

  return res.status(200).json({
    jobs,
    totalJobs,
    totalPages,
    currentPage: pageNum,
  });
});

const getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await Job.findById(id).populate('createdBy', 'name email');
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  return res.status(200).json({ job });
});

const updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await Job.findById(id);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  const userId = req.user && req.user.id;
  if (!userId) {
    throw new AppError('Not authorized', 401);
  }

  if (job.createdBy.toString() !== userId) {
    throw new AppError('Access denied', 403);
  }

  const allowedFields = ['title', 'description', 'company', 'location', 'salary'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      job[field] = req.body[field];
    }
  });

  const updatedJob = await job.save();

  return res.status(200).json({ job: updatedJob });
});

const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await Job.findById(id);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  const userId = req.user && req.user.id;
  if (!userId) {
    throw new AppError('Not authorized', 401);
  }

  if (job.createdBy.toString() !== userId) {
    throw new AppError('Access denied', 403);
  }

  await job.deleteOne();

  return res.status(200).json({ message: 'Job deleted successfully' });
});

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
};
