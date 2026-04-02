const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 公开路由（可选认证，未登录用户可查看孩子看板任务）
router.get('/', optionalAuth, taskController.getAll);
router.get('/today', optionalAuth, taskController.getToday);
router.get('/stats', optionalAuth, taskController.getStats);
router.get('/:id', optionalAuth, taskController.getById);

// 需要认证的路由
router.post('/', authenticate, taskController.create);

// 更新和删除：未登录用户只能完成任务状态
router.put('/:id', optionalAuth, taskController.update);
router.delete('/:id', authenticate, taskController.delete);

// 切换完成状态（允许未登录用户操作）
router.patch('/:id/toggle', optionalAuth, taskController.toggleComplete);

module.exports = router;