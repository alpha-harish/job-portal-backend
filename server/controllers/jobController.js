const mongoose = require('mongoose');

const Job = require('../models/Job');

const createJob = async (req, res) => {
  try {
    const { title, description, company, location, salary } = req.body;

    if (!title || !description || !company || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const createdBy = req.user && req.user.id;
    if (!createdBy) {
      return res.status(401).json({ message: 'No token provided' });
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
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAllJobs = async (req, res) => {
  try {
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
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const job = await Job.findById(id).populate('createdBy', 'name email');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    return res.status(200).json({ job });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No token provided' });
    }

    if (job.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    const allowedFields = ['title', 'description', 'company', 'location', 'salary'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    const updatedJob = await job.save();

    return res.status(200).json({ job: updatedJob });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No token provided' });
    }

    if (job.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    await job.deleteOne();

    return res.status(200).json({ message: 'Job deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
};
