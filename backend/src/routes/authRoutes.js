const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
], authController.login);

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', [
  body('username')
    .isLength({ min: 2, max: 50 }).withMessage('用户名长度应为2-50个字符')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/).withMessage('用户名只能包含字母、数字、下划线和中文'),
  body('password')
    .isLength({ min: 6 }).withMessage('密码长度至少6位'),
  body('email')
    .optional()
    .isEmail().withMessage('邮箱格式不正确'),
  body('role')
    .optional()
    .isIn(['admin', 'parent', 'child']).withMessage('角色类型无效')
], authController.register);

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   PUT /api/auth/me
 * @desc    更新当前用户信息
 * @access  Private
 */
router.put('/me', authenticate, authController.updateMe);

/**
 * @route   PUT /api/auth/password
 * @desc    修改密码
 * @access  Private
 */
router.put('/password', authenticate, [
  body('oldPassword').notEmpty().withMessage('旧密码不能为空'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码长度至少6位')
], authController.changePassword);

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新Token
 * @access  Private
 */
router.post('/refresh', authenticate, authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;