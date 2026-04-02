const express = require('express');
const router = express.Router();
const { HabitRecord, StarRecord, sequelize } = require('../models');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 默认习惯星星规则
const DEFAULT_HABIT_STAR_RULES = {
  early_sleep: { earned: 6, failed: -8, label: '早睡' },
  early_wake: { earned: 8, failed: -10, label: '早起' },
  pack_bag: { earned: 2, failed: -3, label: '收书包' },
  play_game: { earned: 0, failed: -10, label: '玩游戏' },
  watch_tv: { earned: 0, failed: -5, label: '偷看电视' },
  incomplete_homework: { earned: 0, failed: -10, label: '未完成学校作业' }
};

// 获取习惯星星规则（支持从数据库或使用默认值）
const getHabitStarRules = () => {
  // TODO: 可以从数据库读取自定义规则
  return DEFAULT_HABIT_STAR_RULES;
};

// 获取习惯打卡记录
router.get('/records', optionalAuth, async (req, res) => {
  try {
    const { date, habitType } = req.query;
    const where = { childId: 1 };
    
    if (date) where.recordDate = date;
    if (habitType) where.habitType = habitType;
    
    const records = await HabitRecord.findAll({
      where,
      order: [['record_date', 'DESC']]
    });
    
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('获取习惯记录失败:', error);
    res.status(500).json({ success: false, message: '获取习惯记录失败' });
  }
});

// 获取今日打卡状态
router.get('/today', optionalAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const records = await HabitRecord.findAll({
      where: {
        childId: 1,
        recordDate: today
      }
    });
    
    // 构建今日状态
    const todayStatus = {};
    Object.keys(DEFAULT_HABIT_STAR_RULES).forEach(type => {
      const record = records.find(r => r.habitType === type);
      todayStatus[type] = record ? record.status : null;
    });
    
    res.json({ success: true, data: { date: today, status: todayStatus, records } });
  } catch (error) {
    console.error('获取今日打卡状态失败:', error);
    res.status(500).json({ success: false, message: '获取今日打卡状态失败' });
  }
});

// 获取习惯规则
router.get('/rules', (req, res) => {
  res.json({ success: true, data: DEFAULT_HABIT_STAR_RULES });
});

// 打卡（完成/未完成）或撤销
router.post('/check', optionalAuth, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { habitType, status, date, note, starsEarned: customStars } = req.body;
    const rules = getHabitStarRules();
    
    // 验证习惯类型
    if (!rules[habitType]) {
      await t.rollback();
      return res.status(400).json({ success: false, message: '无效的习惯类型' });
    }
    
    const recordDate = date || new Date().toISOString().split('T')[0];
    const rule = rules[habitType];
    
    // 检查是否已打卡
    const existingRecord = await HabitRecord.findOne({
      where: {
        childId: 1,
        habitType,
        recordDate
      },
      transaction: t
    });
    
    // 获取当前星星余额
    const lastStarRecord = await StarRecord.findOne({
      where: { childId: 1 },
      order: [['created_at', 'DESC']],
      transaction: t
    });
    const currentBalance = lastStarRecord ? lastStarRecord.balance : 0;
    
    if (existingRecord) {
      // 已有记录，撤销操作（不管传了什么status，都执行撤销）
      const previousStars = existingRecord.starsEarned;
      
      // 删除习惯记录
      await existingRecord.destroy({ transaction: t });
      
      // 删除对应的星星记录
      await StarRecord.destroy({
        where: {
          type: 'habit',
          referenceId: existingRecord.id
        },
        transaction: t
      });
      
      // 创建撤销星星记录
      const undoAmount = -previousStars;
      await StarRecord.create({
        childId: 1,
        amount: undoAmount,
        balance: currentBalance + undoAmount,
        type: 'habit_undo',
        referenceId: existingRecord.id,
        description: `撤销${rule.label}打卡`,
        createdBy: req.user?.id || 1
      }, { transaction: t });
      
      await t.commit();
      res.json({ 
        success: true, 
        data: { status: null, newBalance: currentBalance + undoAmount }, 
        message: '已撤销打卡' 
      });
    } else {
      // 新打卡，必须传有效的status
      if (!['completed', 'failed'].includes(status)) {
        await t.rollback();
        return res.status(400).json({ success: false, message: '无效的状态' });
      }
      
      // 支持自定义星星数，如果没有传入则使用规则
      const starsEarned = customStars !== undefined 
        ? parseInt(customStars) 
        : (status === 'completed' ? rule.earned : rule.failed);
      
      const record = await HabitRecord.create({
        childId: 1,
        habitType,
        recordDate,
        status,
        starsEarned,
        note,
        createdBy: req.user?.id || 1
      }, { transaction: t });
      
      // 创建星星记录
      await StarRecord.create({
        childId: 1,
        amount: starsEarned,
        balance: currentBalance + starsEarned,
        type: 'habit',
        referenceId: record.id,
        description: `${rule.label}${status === 'completed' ? '' : '未'}完成`,
        createdBy: req.user?.id || 1
      }, { transaction: t });
      
      await t.commit();
      res.json({ 
        success: true, 
        data: { record, starsEarned, newBalance: currentBalance + starsEarned, status }, 
        message: status === 'completed' 
          ? `打卡成功，获得 ${starsEarned} 星星` 
          : `已记录，扣除 ${Math.abs(starsEarned)} 星星` 
      });
    }
  } catch (error) {
    await t.rollback();
    console.error('打卡失败:', error);
    res.status(500).json({ success: false, message: '打卡失败' });
  }
});

// 获取习惯统计
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { childId: 1 };
    
    if (startDate && endDate) {
      where.recordDate = {
        [sequelize.Op.between]: [startDate, endDate]
      };
    }
    
    const records = await HabitRecord.findAll({ where });
    
    // 统计
    const stats = {
      early_sleep: { completed: 0, failed: 0, totalStars: 0 },
      early_wake: { completed: 0, failed: 0, totalStars: 0 },
      pack_bag: { completed: 0, failed: 0, totalStars: 0 },
      play_game: { completed: 0, failed: 0, totalStars: 0 },
      watch_tv: { completed: 0, failed: 0, totalStars: 0 },
      incomplete_homework: { completed: 0, failed: 0, totalStars: 0 }
    };
    
    records.forEach(record => {
      stats[record.habitType][record.status]++;
      stats[record.habitType].totalStars += record.starsEarned;
    });
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取习惯统计失败:', error);
    res.status(500).json({ success: false, message: '获取习惯统计失败' });
  }
});

module.exports = router;