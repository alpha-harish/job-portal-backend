const express = require('express');

const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');

const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, requireRole('recruiter'), createJob);
router.get('/', getAllJobs);
router.get('/:id', getJobById);
router.put('/:id', authMiddleware, requireRole('recruiter'), updateJob);
router.delete('/:id', authMiddleware, requireRole('recruiter'), deleteJob);

module.exports = router;
