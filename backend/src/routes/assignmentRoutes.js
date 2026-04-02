const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 获取作业列表（孩子看板需要）
router.get('/', optionalAuth, assignmentController.getAll);

// 获取进行中的作业
router.get('/active', optionalAuth, assignmentController.getActive);

// 获取作业统计
router.get('/stats', optionalAuth, assignmentController.getStats);

// 创建作业（需要登录）
router.post('/', authenticate, assignmentController.create);

// 更新作业（需要登录）
router.put('/:id', authenticate, assignmentController.update);

// 完成作业
router.put('/:id/complete', optionalAuth, assignmentController.complete);

// 撤销作业（孩子看板可用）
router.put('/:id/undo', optionalAuth, assignmentController.undo);

// 取消作业
router.put('/:id/cancel', authenticate, assignmentController.cancel);

// 删除作业
router.delete('/:id', authenticate, assignmentController.delete);

module.exports = router;
