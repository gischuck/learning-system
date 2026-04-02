const { User, FamilyMember } = require('../models');
const { generateToken } = require('../middleware/auth');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

/**
 * 用户登录
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ 
      where: { username },
      include: [{
        model: FamilyMember,
        as: 'profile',
        required: false
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 更新最后登录时间
    await user.update({ lastLogin: new Date() });

    // 生成token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          displayName: user.displayName,
          avatar: user.avatar,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
};

/**
 * 用户注册
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, password, email, role, displayName } = req.body;

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被使用'
        });
      }
    }

    // 创建用户
    const user = await User.create({
      username,
      password, // 密码会在model hook中自动加密
      email,
      role: role || 'parent',
      displayName: displayName || username
    });

    // 生成token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          displayName: user.displayName,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
};

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: FamilyMember,
        as: 'profile',
        required: false
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        avatar: user.avatar,
        profile: user.profile,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

/**
 * 更新用户信息
 * PUT /api/auth/me
 */
exports.updateMe = async (req, res) => {
  try {
    const { displayName, email, avatar } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 检查邮箱是否被其他用户使用
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被使用'
        });
      }
    }

    await user.update({
      displayName: displayName || user.displayName,
      email: email || user.email,
      avatar: avatar || user.avatar
    });

    res.json({
      success: true,
      message: '更新成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
};

/**
 * 修改密码
 * PUT /api/auth/password
 */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供旧密码和新密码'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少6位'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证旧密码
    const isValidPassword = await user.validatePassword(oldPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '旧密码错误'
      });
    }

    // 更新密码（会在hook中自动加密）
    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
};

/**
 * 刷新Token
 * POST /api/auth/refresh
 */
exports.refreshToken = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        token
      }
    });
  } catch (error) {
    console.error('刷新Token错误:', error);
    res.status(500).json({
      success: false,
      message: '刷新Token失败'
    });
  }
};

/**
 * 登出
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  // JWT是无状态的，这里只是返回成功响应
  // 如果需要token黑名单，可以在这里实现
  res.json({
    success: true,
    message: '登出成功'
  });
};