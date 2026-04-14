const mongoose = require('mongoose');

const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const getLast7DaysThreshold = () => {
  const now = Date.now();
  return new Date(now - 7 * 24 * 60 * 60 * 1000);
};

const growthPipeline = () => {
  return [
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];
};

const getAdminAnalytics = asyncHandler(async (req, res) => {
  const last7Days = getLast7DaysThreshold();

  const [
    userGrowth,
    jobGrowth,
    applicationGrowth,
    topRecruitersAgg,
    topCompaniesAgg,
    last7DaysUsers,
    last7DaysJobs,
    last7DaysApplications,
  ] = await Promise.all([
    User.aggregate(growthPipeline()),
    Job.aggregate(growthPipeline()),
    Application.aggregate(growthPipeline()),
    Job.aggregate([
      {
        $group: {
          _id: '$createdBy',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'recruiter',
        },
      },
      { $unwind: { path: '$recruiter', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          recruiterId: '$_id',
          count: 1,
          name: '$recruiter.name',
          email: '$recruiter.email',
        },
      },
    ]),
    Job.aggregate([
      {
        $group: {
          _id: '$company',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          company: '$_id',
          count: 1,
        },
      },
    ]),
    User.countDocuments({ createdAt: { $gte: last7Days } }),
    Job.countDocuments({ createdAt: { $gte: last7Days } }),
    Application.countDocuments({ createdAt: { $gte: last7Days } }),
  ]);

  return res.status(200).json({
    success: true,
    analytics: {
      userGrowth,
      jobGrowth,
      applicationGrowth,
      topRecruiters: topRecruitersAgg,
      topCompanies: topCompaniesAgg,
      last7DaysUsers,
      last7DaysJobs,
      last7DaysApplications,
    },
  });
});

const getAdminJobsAnalytics = asyncHandler(async (req, res) => {
  const [totalJobs, totalApplications, mostAppliedJobsAgg, leastAppliedJobsAgg] = await Promise.all([
    Job.countDocuments(),
    Application.countDocuments(),
    Application.aggregate([
      { $group: { _id: '$job', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
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
          count: 1,
          title: '$job.title',
          company: '$job.company',
          location: '$job.location',
        },
      },
    ]),
    Application.aggregate([
      { $group: { _id: '$job', count: { $sum: 1 } } },
      { $sort: { count: 1 } },
      { $limit: 5 },
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
          count: 1,
          title: '$job.title',
          company: '$job.company',
          location: '$job.location',
        },
      },
    ]),
  ]);

  const avgApplicationsPerJob = totalJobs === 0 ? 0 : totalApplications / totalJobs;

  return res.status(200).json({
    success: true,
    analytics: {
      mostAppliedJobs: mostAppliedJobsAgg,
      leastAppliedJobs: leastAppliedJobsAgg,
      avgApplicationsPerJob,
    },
  });
});

const getRecruiterAnalytics = asyncHandler(async (req, res) => {
  const recruiterId = req.user && req.user.id;
  if (!recruiterId || !mongoose.Types.ObjectId.isValid(recruiterId)) {
    throw new AppError('Not authorized', 401);
  }

  const last7Days = getLast7DaysThreshold();

  const recruiterObjectId = new mongoose.Types.ObjectId(recruiterId);

  const jobIds = await Job.find({ createdBy: recruiterId }).distinct('_id');

  const [
    totalJobs,
    totalApplications,
    funnelAgg,
    mostAppliedJobAgg,
    last7DaysJobs,
    last7DaysApplications,
  ] = await Promise.all([
    Job.countDocuments({ createdBy: recruiterId }),
    Application.countDocuments({ job: { $in: jobIds } }),
    Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Job.aggregate([
      { $match: { createdBy: recruiterObjectId } },
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'job',
          as: 'applications',
        },
      },
      {
        $project: {
          _id: 0,
          jobId: '$_id',
          title: 1,
          company: 1,
          location: 1,
          count: { $size: '$applications' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    Job.countDocuments({ createdBy: recruiterId, createdAt: { $gte: last7Days } }),
    Application.countDocuments({ job: { $in: jobIds }, createdAt: { $gte: last7Days } }),
  ]);

  const applicationCounts = await Application.aggregate([
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
        count: 1,
        title: '$job.title',
        company: '$job.company',
        location: '$job.location',
      },
    },
    { $sort: { count: -1 } },
  ]);

  const applicationFunnel = {
    applied: 0,
    reviewed: 0,
    shortlisted: 0,
    rejected: 0,
  };

  for (const row of funnelAgg) {
    if (!row._id) continue;
    const key = String(row._id);
    if (key === 'pending') {
      applicationFunnel.applied = row.count;
    }
    if (key === 'accepted') {
      applicationFunnel.shortlisted = row.count;
    }
    if (key === 'rejected') {
      applicationFunnel.rejected = row.count;
    }
  }

  const mostAppliedJob = mostAppliedJobAgg && mostAppliedJobAgg.length > 0 ? mostAppliedJobAgg[0] : {};

  return res.status(200).json({
    success: true,
    analytics: {
      totalJobs,
      totalApplications,
      applicationsPerJob: applicationCounts,
      mostAppliedJob,
      applicationFunnel,
      last7DaysJobs,
      last7DaysApplications,
    },
  });
});

module.exports = {
  getAdminAnalytics,
  getAdminJobsAnalytics,
  getRecruiterAnalytics,
};
