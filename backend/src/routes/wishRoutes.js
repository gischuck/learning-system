const express = require('express');
const router = express.Router();
const { Wish, StarRecord, sequelize } = require('../models');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 获取所有心愿
router.get('/', optionalAuth, async (req, res) => {
  try {
    const wishes = await Wish.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: wishes });
  } catch (error) {
    console.error('获取心愿失败:', error);
    res.status(500).json({ success: false, message: '获取心愿失败' });
  }
});

// 获取单个心愿
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const wish = await Wish.findByPk(req.params.id);
    if (!wish) {
      return res.status(404).json({ success: false, message: '心愿不存在' });
    }
    res.json({ success: true, data: wish });
  } catch (error) {
    console.error('获取心愿失败:', error);
    res.status(500).json({ success: false, message: '获取心愿失败' });
  }
});

// 创建心愿（孩子提交）
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { title, name, icon, emoji, starsRequired, description, status } = req.body;
    
    // 兼容两种字段名
    const wishName = title || name;
    const wishEmoji = icon || emoji || '🎁';
    const wishStars = starsRequired || 50;
    
    if (!wishName) {
      return res.status(400).json({ success: false, message: '心愿名称不能为空' });
    }
    
    const wish = await Wish.create({
      name: wishName,
      emoji: wishEmoji,
      description: description || '',
      starsRequired: wishStars,
      status: status || 'pending',
      submittedBy: 1, // 默认孩子ID
      createdBy: req.user?.id || 1
    });
    
    res.json({ success: true, data: wish, message: '心愿提交成功' });
  } catch (error) {
    console.error('创建心愿失败:', error);
    res.status(500).json({ success: false, message: '创建心愿失败: ' + error.message });
  }
});

// 审核心愿（家长审核）
router.put('/:id/review', authenticate, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { status, starsRequired } = req.body;
    const wish = await Wish.findByPk(req.params.id);
    
    if (!wish) {
      await t.rollback();
      return res.status(404).json({ success: false, message: '心愿不存在' });
    }
    
    await wish.update({
      status,
      starsRequired: parseInt(starsRequired) || 0,
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    }, { transaction: t });
    
    await t.commit();
    res.json({ success: true, data: wish, message: status === 'approved' ? '心愿已通过' : '心愿已拒绝' });
  } catch (error) {
    await t.rollback();
    console.error('审核心愿失败:', error);
    res.status(500).json({ success: false, message: '审核心愿失败' });
  }
});

// 更新心愿（修改星星数等）
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { starsRequired, name, emoji, status } = req.body;
    const wish = await Wish.findByPk(req.params.id);
    
    if (!wish) {
      return res.status(404).json({ success: false, message: '心愿不存在' });
    }
    
    const updateData = {};
    if (starsRequired !== undefined) updateData.starsRequired = parseInt(starsRequired);
    if (name) updateData.name = name;
    if (emoji) updateData.emoji = emoji;
    if (status) updateData.status = status;
    
    await wish.update(updateData);
    
    res.json({ success: true, data: wish, message: '心愿更新成功' });
  } catch (error) {
    console.error('更新心愿失败:', error);
    res.status(500).json({ success: false, message: '更新心愿失败' });
  }
});

// 兑换心愿
router.post('/:id/redeem', optionalAuth, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const wish = await Wish.findByPk(req.params.id);
    
    if (!wish) {
      await t.rollback();
      return res.status(404).json({ success: false, message: '心愿不存在' });
    }
    
    if (wish.status !== 'approved') {
      await t.rollback();
      return res.status(400).json({ success: false, message: '心愿未通过审核' });
    }
    
    // 获取当前星星余额
    const lastRecord = await StarRecord.findOne({
      where: { childId: 1 },
      order: [['created_at', 'DESC']],
      transaction: t
    });
    const currentBalance = lastRecord ? lastRecord.balance : 0;
    
    if (currentBalance < wish.starsRequired) {
      await t.rollback();
      return res.status(400).json({ success: false, message: '星星不足' });
    }
    
    // 扣除星星
    const newBalance = currentBalance - wish.starsRequired;
    await StarRecord.create({
      childId: 1,
      amount: -wish.starsRequired,
      balance: newBalance,
      type: 'wish',
      referenceId: wish.id,
      description: `兑换心愿：${wish.name}`,
      createdBy: req.user?.id || 1
    }, { transaction: t });
    
    // 更新心愿状态
    await wish.update({
      status: 'completed',
      completedAt: new Date()
    }, { transaction: t });
    
    await t.commit();
    res.json({ success: true, data: { wish, newBalance }, message: '心愿兑换成功' });
  } catch (error) {
    await t.rollback();
    console.error('兑换心愿失败:', error);
    res.status(500).json({ success: false, message: '兑换心愿失败' });
  }
});

// 删除心愿
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const wish = await Wish.findByPk(req.params.id);
    if (!wish) {
      return res.status(404).json({ success: false, message: '心愿不存在' });
    }
    
    await wish.destroy();
    res.json({ success: true, message: '心愿已删除' });
  } catch (error) {
    console.error('删除心愿失败:', error);
    res.status(500).json({ success: false, message: '删除心愿失败' });
  }
});

module.exports = router;