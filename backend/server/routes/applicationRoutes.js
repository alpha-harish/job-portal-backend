const express = require('express');

const {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
} = require('../controllers/applicationController');

const { authMiddleware, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post(
  '/:jobId',
  authMiddleware,
  requireRole('seeker'),
  (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
      if (!err) return next();
      return next(err);
    });
  },
  applyToJob
);

router.get('/my', authMiddleware, requireRole('seeker'), getMyApplications);
router.get('/job/:jobId', authMiddleware, requireRole('recruiter'), getApplicantsForJob);
router.put('/:id', authMiddleware, requireRole('recruiter'), updateApplicationStatus);

module.exports = router;