const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware, claimController.getClaims);
router.get('/:id', authMiddleware, claimController.getClaim);
router.post('/', authMiddleware, claimController.createClaim);
router.patch('/:id', authMiddleware, checkRole(['manager', 'admin']), claimController.updateClaim);
router.delete('/:id', authMiddleware, claimController.deleteClaim);

module.exports = router;
