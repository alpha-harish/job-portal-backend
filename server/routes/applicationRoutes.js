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

      if (err.message === 'Only PDF files allowed') {
        return res.status(400).json({ message: 'Only PDF files allowed' });
      }

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large' });
      }

      return res.status(400).json({ message: 'Only PDF files allowed' });
    });
  },
  applyToJob
);
router.get('/my', authMiddleware, requireRole('seeker'), getMyApplications);
router.get('/job/:jobId', authMiddleware, requireRole('recruiter'), getApplicantsForJob);
router.put('/:id', authMiddleware, requireRole('recruiter'), updateApplicationStatus);

module.exports = router;
