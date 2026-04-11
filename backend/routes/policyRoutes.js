const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware, policyController.getPolicy);
router.patch('/', authMiddleware, checkRole(['admin']), policyController.updatePolicy);

module.exports = router;
