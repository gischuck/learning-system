const express = require('express');
const router = express.Router();
const { StarRecord, Assignment, sequelize, Op } = require('../models');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 习惯星星规则
const HABIT_STAR_RULES = {
  early_sleep: { earned: 6, failed: -8 },
  early_wake: { earned: 8, failed: -10 },
  pack_bag: { earned: 2, failed: -3 }
};

// 获取星星余额
router.get('/balance', optionalAuth, async (req, res) => {
  try {
    const lastRecord = await StarRecord.findOne({
      where: { childId: 1 },
      order: [['created_at', 'DESC']]
    });
    const balance = lastRecord ? lastRecord.balance : 0;
    res.json({ success: true, data: { balance } });
  } catch (error) {
    console.error('获取星星余额失败:', error);
    res.status(500).json({ success: false, message: '获取星星余额失败' });
  }
});

// 获取星星记录
router.get('/records', optionalAuth, async (req, res) => {
  try {
    const { limit = 50, type } = req.query;
    const where = { childId: 1 };
    if (type) where.type = type;
    
    const records = await StarRecord.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('获取星星记录失败:', error);
    res.status(500).json({ success: false, message: '获取星星记录失败' });
  }
});

// 获取星星统计
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const monthEarned = await StarRecord.sum('amount', {
      where: {
        childId: 1,
        type: { [Op.ne]: 'wish' },
        createdAt: { [Op.gte]: startOfMonth },
        amount: { [Op.gt]: 0 }
      }
    }) || 0;
    
    const monthSpent = await StarRecord.sum('amount', {
      where: {
        childId: 1,
        createdAt: { [Op.gte]: startOfMonth },
        amount: { [Op.lt]: 0 }
      }
    }) || 0;
    
    const weekEarned = await StarRecord.sum('amount', {
      where: {
        childId: 1,
        type: { [Op.ne]: 'wish' },
        createdAt: { [Op.gte]: startOfWeek },
        amount: { [Op.gt]: 0 }
      }
    }) || 0;
    
    const lastRecord = await StarRecord.findOne({
      where: { childId: 1 },
      order: [['created_at', 'DESC']]
    });
    const balance = lastRecord ? lastRecord.balance : 0;
    
    res.json({
      success: true,
      data: { balance, monthEarned, monthSpent: Math.abs(monthSpent), weekEarned }
    });
  } catch (error) {
    console.error('获取星星统计失败:', error);
    res.status(500).json({ success: false, message: '获取星星统计失败' });
  }
});

// 手动调整星星
router.post('/adjust', authenticate, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { amount, description } = req.body;
    
    const lastRecord = await StarRecord.findOne({
      where: { childId: 1 },
      order: [['created_at', 'DESC']],
      transaction: t
    });
    const currentBalance = lastRecord ? lastRecord.balance : 0;
    const newBalance = currentBalance + parseInt(amount);
    
    await StarRecord.create({
      childId: 1,
      amount: parseInt(amount),
      balance: newBalance,
      type: 'manual',
      description: description || (amount > 0 ? '手动奖励' : '手动扣除'),
      createdBy: req.user.id
    }, { transaction: t });
    
    await t.commit();
    res.json({ success: true, data: { newBalance }, message: '星星调整成功' });
  } catch (error) {
    await t.rollback();
    console.error('调整星星失败:', error);
    res.status(500).json({ success: false, message: '调整星星失败' });
  }
});

// 完成作业获得星星
router.post('/assignment/:assignmentId', optionalAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { stars } = req.body;
    const assignmentId = req.params.assignmentId;
    
    const existingRecord = await StarRecord.findOne({
      where: { childId: 1, type: 'assignment', referenceId: assignmentId },
      transaction: t
    });
    
    if (existingRecord) {
      await t.rollback();
      return res.status(400).json({ success: false, message: '该作业已获得星星' });
    }
    
    const lastRecord = await StarRecord.findOne({
      where: { childId: 1 },
      order: [['created_at', 'DESC']],
      transaction: t
    });
    const currentBalance = lastRecord ? lastRecord.balance : 0;
    const newBalance = currentBalance + parseInt(stars);
    
    const assignment = await Assignment.findByPk(assignmentId);
    
    await StarRecord.create({
      childId: 1,
      amount: parseInt(stars),
      balance: newBalance,
      type: 'assignment',
      referenceId: parseInt(assignmentId),
      description: `完成作业：${assignment?.title || '未知作业'}`,
      createdBy: req.user?.id || 1
    }, { transaction: t });
    
    await t.commit();
    res.json({ success: true, data: { stars, newBalance }, message: `获得 ${stars} 星星` });
  } catch (error) {
    await t.rollback();
    console.error('获得星星失败:', error);
    res.status(500).json({ success: false, message: '获得星星失败' });
  }
});

module.exports = router;