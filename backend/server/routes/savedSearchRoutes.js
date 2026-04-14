const express = require('express');

const {
  createSavedSearch,
  getSavedSearches,
  deleteSavedSearch,
} = require('../controllers/savedSearchController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, requireRole('seeker'));

router.post('/', createSavedSearch);
router.get('/', getSavedSearches);
router.delete('/:id', deleteSavedSearch);

module.exports = router;
