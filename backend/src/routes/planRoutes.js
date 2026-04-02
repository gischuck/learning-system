const express = require('express');
const router = express.Router();

const planController = require('../controllers/planController');
const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');

// 公开路由（可选认证 - 未登录用户可查看）
router.get('/', optionalAuth, planController.getAll);
router.get('/:id', optionalAuth, planController.getById);

// 需要认证的路由 - 创建需要登录
router.post('/', authenticate, planController.create);

// 更新和删除需要家长或管理员权限
router.put('/:id', authenticate, planController.update);
router.delete('/:id', authenticate, planController.delete);

module.exports = router;