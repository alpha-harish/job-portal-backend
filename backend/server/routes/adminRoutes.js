const express = require('express');

const { authMiddleware, requireRole } = require('../middleware/auth');
const {
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUser,
  changeUserRole,
  getAllJobs,
  deleteJob,
  getAdminDashboard,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/test', authMiddleware, requireRole('recruiter'), (req, res) => {
  return res.status(200).json({
    message: 'Admin route accessed successfully',
    user: req.user,
  });
});

router.use(authMiddleware, requireRole('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/unblock', unblockUser);
router.patch('/users/:id/role', changeUserRole);
router.delete('/users/:id', deleteUser);

router.get('/jobs', getAllJobs);
router.delete('/jobs/:id', deleteJob);

router.get('/dashboard', getAdminDashboard);

module.exports = router;
