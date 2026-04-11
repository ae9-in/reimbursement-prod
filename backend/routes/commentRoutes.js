const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authMiddleware } = require('../middleware/auth');

router.get('/:claimId', authMiddleware, commentController.getComments);
router.post('/', authMiddleware, commentController.addComment);

module.exports = router;
