const express = require('express');

const {
  addBookmark,
  removeBookmark,
  getMyBookmarks,
} = require('../controllers/bookmarkController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, requireRole('seeker'));

router.post("/", addBookmark);
router.delete("/", removeBookmark);
router.get("/", getMyBookmarks);

module.exports = router;
