const express = require('express');
const router = express.Router();
const { Assignment, Todo, StarRecord, User, sequelize } = require('../models');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 获取待审核列表
router.get('/pending', authenticate, async (req, res) => {
  try {
    const pendingAssignments = await Assignment.findAll({
      where: { status: 'completed', approvalStatus: 'pending' },
      order: [['completedAt', 'DESC']]
    });

    const pendingTodos = await Todo.findAll({
      where: { status: 'completed', approvalStatus: 'pending' },
      order: [['completedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        assignments: pendingAssignments,
        todos: pendingTodos
      }
    });
  } catch (error) {
    console.error('获取待审核列表失败:', error);
    res.json({ success: false, message: '获取失败' });
  }
});

// 审核作业
router.post('/assignment/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, notes } = req.body;

    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.json({ success: false, message: '作业不存在' });
    }

    if (assignment.approvalStatus !== 'pending') {
      return res.json({ success: false, message: '该作业已审核' });
    }

    const approvalStatus = approved ? 'approved' : 'rejected';
    
    // 更新作业状态
    const updateData = {
      approvalStatus,
      approvalNotes: notes || '',
      approvedBy: req.user.id,
      approvedAt: new Date()
    };
    
    // 如果拒绝，重置为可重做状态
    if (!approved) {
      updateData.status = 'active';
    }
    
    await assignment.update(updateData);

    // 审核通过，发放星星
    if (approved && assignment.starReward > 0) {
      // 获取当前余额
      const lastRecord = await StarRecord.findOne({ order: [['createdAt', 'DESC']] });
      const currentBalance = lastRecord ? lastRecord.balance : 0;
      
      const userId = assignment.completedBy || 1;
      await StarRecord.create({
        userId,
        amount: assignment.starReward,
        balance: currentBalance + assignment.starReward,
        type: 'assignment',
        description: `完成作业：${assignment.title}`,
        referenceId: assignment.id,
        createdBy: req.user.id
      });
    }

    res.json({
      success: true,
      message: approved ? '审核通过，星星已发放' : '审核拒绝，孩子可以重新完成',
      data: assignment
    });
  } catch (error) {
    console.error('审核作业失败:', error);
    res.json({ success: false, message: '审核失败: ' + error.message });
  }
});

// 审核待办
router.post('/todo/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, notes } = req.body;

    const todo = await Todo.findByPk(id);
    if (!todo) {
      return res.json({ success: false, message: '待办不存在' });
    }

    if (todo.approvalStatus !== 'pending') {
      return res.json({ success: false, message: '该待办已审核' });
    }

    const approvalStatus = approved ? 'approved' : 'rejected';
    
    // 更新待办状态
    const updateData = {
      approvalStatus,
      approvalNotes: notes || '',
      approvedBy: req.user.id,
      approvedAt: new Date()
    };
    
    // 如果拒绝，重置为可重做状态
    if (!approved) {
      updateData.status = 'pending';
    }
    
    await todo.update(updateData);

    // 审核通过，发放星星
    if (approved && todo.points > 0) {
      // 获取当前余额
      const lastRecord = await StarRecord.findOne({ order: [['createdAt', 'DESC']] });
      const currentBalance = lastRecord ? lastRecord.balance : 0;
      
      const userId = todo.completedBy || 1;
      await StarRecord.create({
        userId,
        amount: todo.points,
        balance: currentBalance + todo.points,
        type: 'todo',
        description: `完成待办：${todo.title}`,
        referenceId: todo.id,
        createdBy: req.user.id
      });
    }

    res.json({
      success: true,
      message: approved ? '审核通过，星星已发放' : '审核拒绝，孩子可以重新完成',
      data: todo
    });
  } catch (error) {
    console.error('审核待办失败:', error);
    res.json({ success: false, message: '审核失败: ' + error.message });
  }
});

// 获取审核历史
router.get('/history', authenticate, async (req, res) => {
  try {
    const approvedAssignments = await Assignment.findAll({
      where: { approvalStatus: ['approved', 'rejected'] },
      order: [['approvedAt', 'DESC']],
      limit: 50
    });

    const approvedTodos = await Todo.findAll({
      where: { approvalStatus: ['approved', 'rejected'] },
      order: [['approvedAt', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      data: {
        assignments: approvedAssignments,
        todos: approvedTodos
      }
    });
  } catch (error) {
    console.error('获取审核历史失败:', error);
    res.json({ success: false, message: '获取失败' });
  }
});

module.exports = router;