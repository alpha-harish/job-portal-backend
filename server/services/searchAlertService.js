const SavedSearch = require('../models/SavedSearch');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationService');
const { sendEmail } = require('../utils/emailService');

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const jobMatchesSavedSearch = (job, savedSearch) => {
  if (!job || !savedSearch) return false;

  const searchValue = savedSearch.search;
  if (searchValue) {
    const safe = escapeRegex(searchValue);
    const re = new RegExp(safe, 'i');
    const title = job.title || '';
    const description = job.description || '';
    if (!re.test(title) && !re.test(description)) return false;
  }

  if (savedSearch.location) {
    const safe = escapeRegex(savedSearch.location);
    const re = new RegExp(safe, 'i');
    if (!re.test(job.location || '')) return false;
  }

  if (savedSearch.company) {
    const safe = escapeRegex(savedSearch.company);
    const re = new RegExp(safe, 'i');
    if (!re.test(job.company || '')) return false;
  }

  const salary = typeof job.salary === 'number' ? job.salary : Number(job.salary);

  if (savedSearch.minSalary !== undefined && savedSearch.minSalary !== null) {
    if (!Number.isFinite(salary) || salary < Number(savedSearch.minSalary)) return false;
  }

  if (savedSearch.maxSalary !== undefined && savedSearch.maxSalary !== null) {
    if (!Number.isFinite(salary) || salary > Number(savedSearch.maxSalary)) return false;
  }

  return true;
};

const runAlertsForNewJob = async (job) => {
  if (!job) return;

  console.log("Running search alerts for job:", job.title);

  const createdAt = job.createdAt ? new Date(job.createdAt) : new Date();

  const savedSearches = await SavedSearch.find({})
    .select('user search location company minSalary maxSalary lastCheckedAt')
    .lean();

  console.log("Saved searches found:", savedSearches.length);

  if (!savedSearches || savedSearches.length === 0) return;

  const userIds = Array.from(new Set(savedSearches.map((s) => String(s.user))));
  const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const updates = [];

  for (const savedSearch of savedSearches) {
    const lastCheckedAt = savedSearch.lastCheckedAt ? new Date(savedSearch.lastCheckedAt) : null;

    if (lastCheckedAt && createdAt <= lastCheckedAt) {
      continue;
    }

    if (!jobMatchesSavedSearch(job, savedSearch)) {
      continue;
    }

    console.log("Match found for user:", savedSearch.user.toString());

    const user = userMap.get(String(savedSearch.user));

    try {
      await createNotification({
        user: savedSearch.user,
        type: 'job_alert',
        message: 'New job matches your saved search',
        job: job._id,
      });

      console.log("Notification created");

      if (user && user.email) {
        const subject = 'New job matches your saved search';
        const text = `A new job matches your saved search.\n\nTitle: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\nSalary: ${job.salary || ''}\n\nApply link: ${process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/jobs/${job._id}` : ''}`;
        
        await sendEmail({ to: user.email, subject, text });

        console.log("Email alert sent");
      }

      updates.push({
        updateOne: {
          filter: { _id: savedSearch._id },
          update: { $set: { lastCheckedAt: createdAt } },
        },
      });
    } catch (err) {
      console.log("Alert error:", err.message);
    }
  }

  if (updates.length > 0) {
    try {
      await SavedSearch.bulkWrite(updates);
      console.log("Saved search lastCheckedAt updated");
    } catch (err) {
      console.log("Bulk update error:", err.message);
    }
  }
};

module.exports = {
  runAlertsForNewJob,
};