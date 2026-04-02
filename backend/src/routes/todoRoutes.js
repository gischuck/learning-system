const express = require('express');
const router = express.Router();

const todoController = require('../controllers/todoController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 公开路由（可选认证 - 未登录用户可查看和打勾完成）
router.get('/', optionalAuth, todoController.getAll);
router.get('/:id', optionalAuth, todoController.getById);

// 需要认证的路由 - 创建需要登录
router.post('/', authenticate, todoController.create);

// 更新：未登录用户只能打勾完成
router.put('/:id', optionalAuth, todoController.update);

// 删除需要登录
router.delete('/:id', authenticate, todoController.delete);

// 切换状态（允许未登录用户操作 - 用于孩子打勾）
router.patch('/:id/toggle', optionalAuth, todoController.toggleStatus);

module.exports = router;