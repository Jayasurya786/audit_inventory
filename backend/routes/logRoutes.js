const express = require('express');
const logController = require('../controllers/logController');

const router = express.Router();

router.get('/', logController.getLogs);
router.post('/upload', logController.bulkUploadLogs);

module.exports = router;