const express = require('express');

const {
  getNotifications,
  markAsRead,
  getUnreadCount,
} = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread', getUnreadCount);
router.put('/:id/read', markAsRead);

module.exports = router;
