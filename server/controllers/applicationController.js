const mongoose = require('mongoose');
const streamifier = require('streamifier');

const Application = require('../models/Application');
const Job = require('../models/Job');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
  notifyRecruiterNewApplicant,
  notifySeekerStatusUpdate,
} = require('../utils/notificationService');

// APPLY TO JOB
const applyToJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  const userId = req.user.id;

  const existing = await Application.findOne({ user: userId, job: jobId });
  if (existing) {
    throw new AppError('Already applied', 409);
  }

  if (!req.file) {
    throw new AppError('Resume is required', 400);
  }

  const uploadResumeToCloudinary = () => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'resumes',
          resource_type: 'raw',
        },
        (error, result) => {
          if (error) return reject(error);
          return resolve(result);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });
  };

  let uploadResult;
  try {
    uploadResult = await uploadResumeToCloudinary();
  } catch (err) {
    throw new AppError('Server error', 500);
  }

  const resume = {
    url: uploadResult.secure_url,
    public_id: uploadResult.public_id,
  };

  let application;
  try {
    application = await Application.create({
      user: userId,
      job: jobId,
      resume,
    });
  } catch (err) {
    if (err && err.code === 11000) {
      throw new AppError('Already applied', 409);
    }
    throw err;
  }

  try {
    await notifyRecruiterNewApplicant({
      recruiterId: job.createdBy,
      job,
      application,
    });
  } catch (err) {
    // Do not block application creation if notification fails
  }

  return res.status(201).json({ application });
});

// GET MY APPLICATIONS
const getMyApplications = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const applications = await Application.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate('job', 'title company location');

  return res.status(200).json({ applications });
});

// GET APPLICANTS FOR A JOB
const getApplicantsForJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  const userId = req.user.id;

  if (!job.createdBy.equals(userId)) {
    throw new AppError('Access denied', 403);
  }

  const applications = await Application.find({ job: jobId })
    .sort({ createdAt: -1 })
    .populate('user', 'name email');

  return res.status(200).json({ applications });
});

// UPDATE APPLICATION STATUS
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'accepted', 'rejected'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const application = await Application.findById(id);
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  const job = await Job.findById(application.job);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  const userId = req.user.id;
  if (!job.createdBy.equals(userId)) {
    throw new AppError('Access denied', 403);
  }

  application.status = status;
  await application.save();

  try {
    await notifySeekerStatusUpdate({
      seekerId: application.user,
      status,
      job,
      application,
    });
  } catch (err) {
    // Do not block status update if notification fails
  }

  return res.status(200).json({ application });
});

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
};