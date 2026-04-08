const mongoose = require('mongoose');

const Job = require('../models/Job');
const Application = require('../models/Application');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const getRecruiterDashboard = asyncHandler(async (req, res) => {
  const recruiterId = req.user && req.user.id;

  if (!recruiterId || !mongoose.Types.ObjectId.isValid(recruiterId)) {
    throw new AppError('Not authorized', 401);
  }

  const jobs = await Job.find({ createdBy: recruiterId }).select('_id');
  const jobIds = jobs.map((j) => j._id);

  const totalJobs = jobs.length;

  if (jobIds.length === 0) {
    return res.status(200).json({
      stats: {
        totalJobs: 0,
        totalApplications: 0,
        pendingApplications: 0,
        acceptedApplications: 0,
        rejectedApplications: 0,
      },
      applicationsPerJob: [],
      latestApplications: [],
    });
  }

  const [
    totalApplications,
    pendingApplications,
    acceptedApplications,
    rejectedApplications,
    applicationsPerJobAgg,
    latestApplications,
  ] = await Promise.all([
    Application.countDocuments({ job: { $in: jobIds } }),
    Application.countDocuments({ job: { $in: jobIds }, status: 'pending' }),
    Application.countDocuments({ job: { $in: jobIds }, status: 'accepted' }),
    Application.countDocuments({ job: { $in: jobIds }, status: 'rejected' }),
    Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: '$job', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          jobId: '$_id',
          title: '$job.title',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]),
    Application.find({ job: { $in: jobIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('job', 'title')
      .populate('user', 'name email'),
  ]);

  return res.status(200).json({
    stats: {
      totalJobs,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
    },
    applicationsPerJob: applicationsPerJobAgg,
    latestApplications,
  });
});

module.exports = {
  getRecruiterDashboard,
};
