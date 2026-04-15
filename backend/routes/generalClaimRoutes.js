const express = require('express');
const router = express.Router();
const controller = require('../controllers/generalClaimController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, controller.getGeneralClaims);
router.get('/:id', authMiddleware, controller.getGeneralClaim);
router.post('/', authMiddleware, controller.createGeneralClaim);
router.patch('/:id', authMiddleware, controller.updateGeneralClaim);
router.delete('/:id', authMiddleware, controller.deleteGeneralClaim);

module.exports = router;
