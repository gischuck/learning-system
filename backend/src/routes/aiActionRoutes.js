/**
 * AI 操作接口 - 允许通过自然语言指令操作系统
 * 所有操作都需要管理员权限
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Assignment, Todo, Schedule, Plan, Wish, StarRecord, User, FamilyMember, sequelize } = require('../models');

// 验证管理员权限
const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'parent')) {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  next();
};

/**
 * 统一操作入口
 * POST /api/ai/action
 */
router.post('/action', authenticate, requireAdmin, async (req, res) => {
  const { action, params } = req.body;
  
  try {
    let result;
    switch (action) {
      case 'create_assignment':
        result = await createAssignment(params, req.user);
        break;
      case 'update_assignment':
        result = await updateAssignment(params);
        break;
      case 'delete_assignment':
        result = await deleteAssignment(params);
        break;
      case 'create_todo':
        result = await createTodo(params, req.user);
        break;
      case 'update_todo':
        result = await updateTodo(params);
        break;
      case 'create_schedule':
        result = await createSchedule(params, req.user);
        break;
      case 'update_schedule':
        result = await updateSchedule(params);
        break;
      case 'delete_schedule':
        result = await deleteSchedule(params);
        break;
      case 'create_wish':
        result = await createWish(params, req.user);
        break;
      case 'approve_assignment':
        result = await approveAssignment(params, req.user);
        break;
      case 'reject_assignment':
        result = await rejectAssignment(params, req.user);
        break;
      case 'approve_todo':
        result = await approveTodo(params, req.user);
        break;
      case 'reject_todo':
        result = await rejectTodo(params, req.user);
        break;
      case 'adjust_stars':
        result = await adjustStars(params, req.user);
        break;
      case 'get_status':
        result = await getStatus(params);
        break;
      case 'get_pending_approvals':
        result = await getPendingApprovals();
        break;
      case 'get_weekly_courses':
        result = await getWeeklyCourses();
        break;
      case 'reset_assignment':
        result = await resetAssignment(params);
        break;
      default:
        return res.json({ success: false, message: `未知操作: ${action}` });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI操作失败:', error);
    res.json({ success: false, message: error.message || '操作失败' });
  }
});

// ==================== 作业相关 ====================

async function createAssignment(params, user) {
  const { title, subject, recurringType, recurringDays, starReward, description } = params;
  
  if (!title) throw new Error('作业标题不能为空');
  
  const assignment = await Assignment.create({
    title,
    subject: subject || '其他',
    description: description || '',
    type: 'homework',
    taskType: recurringType === 'daily' || recurringType === 'weekly' ? 'recurring' : 'once',
    recurringType: recurringType || null,
    recurringDays: recurringDays ? JSON.stringify(recurringDays) : null,
    starReward: starReward || 5,
    status: 'active',
    assignedBy: user.id,
    assignedByName: user.displayName || user.username
  });
  
  return { id: assignment.id, message: `作业「${title}」创建成功` };
}

async function updateAssignment(params) {
  const { id, title, subject, starReward, status } = params;
  
  const assignment = await Assignment.findByPk(id);
  if (!assignment) throw new Error('作业不存在');
  
  await assignment.update({
    title: title || assignment.title,
    subject: subject || assignment.subject,
    starReward: starReward || assignment.starReward,
    status: status || assignment.status
  });
  
  return { message: `作业「${assignment.title}」更新成功` };
}

async function deleteAssignment(params) {
  const { id } = params;
  await Assignment.destroy({ where: { id } });
  return { message: '作业已删除' };
}

async function resetAssignment(params) {
  const { id } = params;
  const assignment = await Assignment.findByPk(id);
  if (!assignment) throw new Error('作业不存在');
  
  await assignment.update({
    status: 'active',
    approvalStatus: null,
    completedAt: null,
    completedBy: null,
    approvedAt: null,
    approvedBy: null
  });
  
  return { message: `作业「${assignment.title}」已重置为未完成` };
}

// ==================== 待办相关 ====================

async function createTodo(params, user) {
  const { title, category, dueDate, points, description } = params;
  
  if (!title) throw new Error('待办标题不能为空');
  
  const todo = await Todo.create({
    title,
    description: description || '',
    category: category || '其他',
    dueDate: dueDate || null,
    points: points || 2,
    status: 'pending',
    createdBy: user.id
  });
  
  return { id: todo.id, message: `待办「${title}」创建成功` };
}

async function updateTodo(params) {
  const { id, title, status, points } = params;
  
  const todo = await Todo.findByPk(id);
  if (!todo) throw new Error('待办不存在');
  
  await todo.update({
    title: title || todo.title,
    status: status || todo.status,
    points: points || todo.points
  });
  
  return { message: `待办「${todo.title}」更新成功` };
}

// ==================== 课程表相关 ====================

async function createSchedule(params, user) {
  const { title, dayOfWeek, startTime, endTime, location, icon, color } = params;
  
  if (!title || dayOfWeek === undefined) throw new Error('课程名称和星期不能为空');
  
  const schedule = await Schedule.create({
    title,
    dayOfWeek,
    startTime: startTime || '09:00',
    endTime: endTime || '10:00',
    location: location || '',
    icon: icon || '📖',
    color: color || '#60A5FA',
    status: 'active',
    createdBy: user.id
  });
  
  return { id: schedule.id, message: `课程「${title}」添加成功` };
}

async function updateSchedule(params) {
  const { id, title, dayOfWeek, startTime, location } = params;
  
  const schedule = await Schedule.findByPk(id);
  if (!schedule) throw new Error('课程不存在');
  
  await schedule.update({
    title: title || schedule.title,
    dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : schedule.dayOfWeek,
    startTime: startTime || schedule.startTime,
    location: location || schedule.location
  });
  
  return { message: `课程「${schedule.title}」更新成功` };
}

async function deleteSchedule(params) {
  const { id } = params;
  await Schedule.destroy({ where: { id } });
  return { message: '课程已删除' };
}

// ==================== 心愿相关 ====================

async function createWish(params, user) {
  const { title, starsRequired, icon, description } = params;
  
  if (!title || !starsRequired) throw new Error('心愿名称和所需星星不能为空');
  
  const wish = await Wish.create({
    title,
    description: description || '',
    starsRequired,
    icon: icon || '🎁',
    status: 'pending',
    createdBy: user.id
  });
  
  return { id: wish.id, message: `心愿「${title}」创建成功，等待审核` };
}

// ==================== 审核相关 ====================

async function approveAssignment(params, user) {
  const { id, notes } = params;
  
  const assignment = await Assignment.findByPk(id);
  if (!assignment) throw new Error('作业不存在');
  if (assignment.approvalStatus !== 'pending') throw new Error('该作业已审核');
  
  await assignment.update({
    approvalStatus: 'approved',
    approvalNotes: notes || '',
    approvedBy: user.id,
    approvedAt: new Date()
  });
  
  // 发放星星
  if (assignment.starReward > 0) {
    const currentBalance = await getCurrentBalance();
    await StarRecord.create({
      userId: 1,
      amount: assignment.starReward,
      balance: currentBalance + assignment.starReward,
      type: 'assignment',
      description: `完成作业：${assignment.title}`,
      referenceId: assignment.id,
      createdBy: user.id
    });
  }
  
  return { message: `作业「${assignment.title}」审核通过，+${assignment.starReward}⭐` };
}

async function rejectAssignment(params, user) {
  const { id, notes } = params;
  
  const assignment = await Assignment.findByPk(id);
  if (!assignment) throw new Error('作业不存在');
  
  await assignment.update({
    approvalStatus: 'rejected',
    approvalNotes: notes || '',
    approvedBy: user.id,
    approvedAt: new Date()
  });
  
  // 重置状态让可以重做
  await assignment.update({ status: 'active' });
  
  return { message: `作业「${assignment.title}」已拒绝，孩子可以重新完成` };
}

async function approveTodo(params, user) {
  const { id, notes } = params;
  
  const todo = await Todo.findByPk(id);
  if (!todo) throw new Error('待办不存在');
  if (todo.approvalStatus !== 'pending') throw new Error('该待办已审核');
  
  await todo.update({
    approvalStatus: 'approved',
    approvalNotes: notes || '',
    approvedBy: user.id,
    approvedAt: new Date()
  });
  
  // 发放星星
  if (todo.points > 0) {
    const currentBalance = await getCurrentBalance();
    await StarRecord.create({
      userId: 1,
      amount: todo.points,
      balance: currentBalance + todo.points,
      type: 'todo',
      description: `完成待办：${todo.title}`,
      referenceId: todo.id,
      createdBy: user.id
    });
  }
  
  return { message: `待办「${todo.title}」审核通过，+${todo.points}⭐` };
}

async function rejectTodo(params, user) {
  const { id, notes } = params;
  
  const todo = await Todo.findByPk(id);
  if (!todo) throw new Error('待办不存在');
  
  await todo.update({
    approvalStatus: 'rejected',
    approvalNotes: notes || '',
    approvedBy: user.id,
    approvedAt: new Date(),
    status: 'pending'
  });
  
  return { message: `待办「${todo.title}」已拒绝` };
}

// ==================== 星星相关 ====================

async function adjustStars(params, user) {
  const { amount, description } = params;
  
  if (!amount) throw new Error('调整数量不能为空');
  
  const currentBalance = await getCurrentBalance();
  const newBalance = currentBalance + amount;
  
  if (newBalance < 0) throw new Error('星星余额不足');
  
  await StarRecord.create({
    userId: 1,
    amount,
    balance: newBalance,
    type: amount > 0 ? 'bonus' : 'penalty',
    description: description || (amount > 0 ? '奖励星星' : '扣除星星'),
    createdBy: user.id
  });
  
  return { message: `${amount > 0 ? '奖励' : '扣除'} ${Math.abs(amount)} 星星，当前余额: ${newBalance}⭐` };
}

// ==================== 查询相关 ====================

async function getStatus(params) {
  const [assignments, todos, schedules, wishes, stars] = await Promise.all([
    Assignment.findAll({ order: [['createdAt', 'DESC']], limit: 20 }),
    Todo.findAll({ order: [['createdAt', 'DESC']], limit: 20 }),
    Schedule.findAll({ where: { status: 'active' }, order: [['dayOfWeek', 'ASC']] }),
    Wish.findAll({ where: { status: 'approved' }, order: [['createdAt', 'DESC']] }),
    StarRecord.findOne({ order: [['createdAt', 'DESC']] })
  ]);
  
  return {
    assignments: assignments.map(a => ({
      id: a.id, title: a.title, subject: a.subject, status: a.status,
      approvalStatus: a.approvalStatus, recurringType: a.recurringType, starReward: a.starReward
    })),
    todos: todos.map(t => ({
      id: t.id, title: t.title, category: t.category, status: t.status,
      approvalStatus: t.approvalStatus, points: t.points, dueDate: t.dueDate
    })),
    schedules: schedules.map(s => ({
      id: s.id, title: s.title, dayOfWeek: s.dayOfWeek, startTime: s.startTime, location: s.location
    })),
    wishes: wishes.map(w => ({
      id: w.id, title: w.title, starsRequired: w.starsRequired, icon: w.icon
    })),
    starBalance: stars ? stars.balance : 0
  };
}

async function getPendingApprovals() {
  const [assignments, todos] = await Promise.all([
    Assignment.findAll({ where: { status: 'completed', approvalStatus: 'pending' }, order: [['completedAt', 'DESC']] }),
    Todo.findAll({ where: { status: 'completed', approvalStatus: 'pending' }, order: [['completedAt', 'DESC']] })
  ]);
  
  return {
    assignments: assignments.map(a => ({
      id: a.id, title: a.title, subject: a.subject, starReward: a.starReward, completedAt: a.completedAt
    })),
    todos: todos.map(t => ({
      id: t.id, title: t.title, category: t.category, points: t.points, completedAt: t.completedAt
    }))
  };
}

async function getWeeklyCourses() {
  const schedules = await Schedule.findAll({ 
    where: { status: 'active' }, 
    order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']] 
  });
  
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const byDay = {};
  
  schedules.forEach(s => {
    const day = weekDays[s.dayOfWeek];
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push({
      id: s.id,
      title: s.title,
      time: `${s.startTime}${s.endTime ? ' - ' + s.endTime : ''}`,
      location: s.location
    });
  });
  
  return byDay;
}

// ==================== 辅助函数 ====================

async function getCurrentBalance() {
  const lastRecord = await StarRecord.findOne({ order: [['createdAt', 'DESC']] });
  return lastRecord ? lastRecord.balance : 0;
}

module.exports = router;