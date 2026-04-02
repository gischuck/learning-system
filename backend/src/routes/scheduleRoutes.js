const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 公开路由（可选认证）
router.get('/', optionalAuth, scheduleController.getAll);
router.get('/weekly', optionalAuth, scheduleController.getWeekly);
router.get('/today', optionalAuth, scheduleController.getToday);
router.get('/stats', optionalAuth, scheduleController.getStats);
router.get('/:id', optionalAuth, scheduleController.getById);

// 需要认证的路由
router.post('/', authenticate, scheduleController.create);
router.post('/batch', authenticate, scheduleController.batchCreate);
router.put('/:id', authenticate, scheduleController.update);
router.delete('/:id', authenticate, scheduleController.delete);

module.exports = router;