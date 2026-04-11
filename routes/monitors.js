const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/monitorController');

router.post('/', ctrl.registerMonitor);
router.post('/:id/heartbeat', ctrl.heartbeat);
router.post('/:id/pause', ctrl.pauseMonitor);
router.get('/', ctrl.listMonitors); //My Developer's Choice

module.exports = router;