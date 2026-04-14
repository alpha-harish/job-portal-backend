const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNewApplicantEmail, sendStatusEmail } = require('./emailService');

const createNotification = async ({ user, type, message, job, application }) => {
  const dedupeQuery = {
    user,
    type,
    ...(job ? { job } : {}),
    ...(application ? { application } : {}),
  };

  const existing = await Notification.findOne(dedupeQuery);
  if (existing) return existing;

  return Notification.create({
    user,
    type,
    message,
    job,
    application,
  });
};

const notifyRecruiterNewApplicant = async ({ recruiterId, job, application }) => {
  const message = `New applicant for ${job.title}`;

  const notification = await createNotification({
    user: recruiterId,
    type: 'new_applicant',
    message,
    job: job._id,
    application: application._id,
  });

  try {
    const [recruiter, seeker] = await Promise.all([
      User.findById(recruiterId).select('email'),
      User.findById(application.user).select('name email'),
    ]);

    if (recruiter && recruiter.email && seeker && seeker.email) {
      await sendNewApplicantEmail({
        to: recruiter.email,
        jobTitle: job.title,
        seekerName: seeker.name,
        seekerEmail: seeker.email,
        resumeUrl: application && application.resume ? application.resume.url : undefined,
      });
    }
  } catch (err) {
    console.error('Email failed:', err && err.message ? err.message : err);
  }

  return notification;
};

const notifySeekerStatusUpdate = async ({ seekerId, status, job, application }) => {
  if (status !== 'accepted' && status !== 'rejected') return null;

  const message =
    status === 'accepted'
      ? `Your application accepted for ${job.title}`
      : `Your application rejected for ${job.title}`;

  const notification = await createNotification({
    user: seekerId,
    type: `application_${status}`,
    message,
    job: job._id,
    application: application && application._id ? application._id : application,
  });

  try {
    const [seeker, recruiter] = await Promise.all([
      User.findById(seekerId).select('email'),
      User.findById(job.createdBy).select('name'),
    ]);

    if (seeker && seeker.email) {
      await sendStatusEmail({
        to: seeker.email,
        status,
        jobTitle: job.title,
        companyName: job.company,
        recruiterName: recruiter && recruiter.name ? recruiter.name : undefined,
      });
    }
  } catch (err) {
    console.error('Email failed:', err && err.message ? err.message : err);
  }

  return notification;
};

module.exports = {
  createNotification,
  notifyRecruiterNewApplicant,
  notifySeekerStatusUpdate,
};
