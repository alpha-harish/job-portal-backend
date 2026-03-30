const mongoose = require('mongoose');
const streamifier = require('streamifier');

const Application = require('../models/Application');
const Job = require('../models/Job');
const cloudinary = require('../config/cloudinary');

// APPLY TO JOB
const applyToJob = async (req, res) => {
  //console.log("FILE OBJECT:", req.file);
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const userId = req.user.id; // already ensured by authMiddleware

    const existing = await Application.findOne({ user: userId, job: jobId });
    if (existing) {
      return res.status(400).json({ message: 'Already applied to this job' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Resume is required' });
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
      return res.status(500).json({ message: 'Server error' });
    }

    const resume = {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };

    const application = await Application.create({
      user: userId,
      job: jobId,
      resume,
    });

    return res.status(201).json({ application });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Already applied to this job' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET MY APPLICATIONS
const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    const applications = await Application.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('job', 'title company location');

    return res.status(200).json({ applications });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET APPLICANTS FOR A JOB
const getApplicantsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const userId = req.user.id;

    // Ownership check (correct)
    if (!job.createdBy.equals(userId)) {
      return res.status(403).json({ message: 'Forbidden: not your job' });
    }

    const applications = await Application.find({ job: jobId })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    return res.status(200).json({ applications });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE APPLICATION STATUS
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = await Job.findById(application.job);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const userId = req.user.id;

    // Ownership check (correct)
    if (!job.createdBy.equals(userId)) {
      return res.status(403).json({ message: 'Forbidden: not your job' });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({ application });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
};