const { Assignment, FamilyMember } = require('../models');
const { authenticate } = require('../middleware/auth');

/**
 * 获取所有作业/任务
 * GET /api/assignments
 */
exports.getAll = async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('获取作业列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 获取进行中的作业
 * GET /api/assignments/active
 */
exports.getActive = async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      where: { status: 'active' },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('获取进行中作业失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 创建作业/任务
 * POST /api/assignments
 */
exports.create = async (req, res) => {
  try {
    const { title, description, type, subject, taskType, recurringType, recurringDays, fixedDate, dueTime } = req.body;
    
    const assignment = await Assignment.create({
      title,
      description,
      type,
      subject,
      taskType,
      recurringType,
      recurringDays,
      fixedDate,
      dueTime,
      assignedBy: req.user.id,
      assignedByName: req.user.displayName || req.user.username
    });
    
    res.json({ success: true, data: assignment, message: '作业布置成功' });
  } catch (error) {
    console.error('创建作业失败:', error);
    res.status(500).json({ success: false, message: '创建失败' });
  }
};

/**
 * 更新作业
 * PUT /api/assignments/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description, type, subject, taskType, recurringType, recurringDays, fixedDate, dueTime } = req.body;
    
    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: '作业不存在' });
    }
    
    await assignment.update({
      status: status || assignment.status,
      approvalStatus: req.body.approvalStatus !== undefined ? req.body.approvalStatus : assignment.approvalStatus,
      title: title || assignment.title,
      description: description !== undefined ? description : assignment.description,
      type: type || assignment.type,
      subject: subject || assignment.subject,
      taskType: taskType || assignment.taskType,
      recurringType: recurringType || assignment.recurringType,
      recurringDays: recurringDays || assignment.recurringDays,
      fixedDate: fixedDate || assignment.fixedDate,
      dueTime: dueTime || assignment.dueTime,
      assignedByName: req.body.assignedByName || assignment.assignedByName
    });
    
    res.json({ success: true, message: '作业更新成功', data: assignment });
  } catch (error) {
    console.error('更新作业失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 完成作业
 * PUT /api/assignments/:id/complete
 */
exports.complete = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body;
    const assignment = await Assignment.findByPk(id);
    
    if (!assignment) {
      return res.status(404).json({ success: false, message: '作业不存在' });
    }
    
    await assignment.update({
      status: 'completed',
      completedAt: new Date(),
      completedBy: req.user?.id || null,
      approvalStatus: approvalStatus || 'pending'
    });
    
    res.json({ success: true, message: '作业已完成', data: assignment });
  } catch (error) {
    console.error('完成作业失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 撤销作业（孩子看板可用）
 * PUT /api/assignments/:id/undo
 */
exports.undo = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);
    
    if (!assignment) {
      return res.status(404).json({ success: false, message: '作业不存在' });
    }
    
    // 只能撤销待审核的作业
    if (assignment.approvalStatus === 'approved') {
      return res.status(400).json({ success: false, message: '已审核通过的作业不能撤销' });
    }
    
    await assignment.update({
      status: 'active',
      approvalStatus: null,
      completedAt: null,
      completedBy: null
    });
    
    res.json({ success: true, message: '已撤销', data: assignment });
  } catch (error) {
    console.error('撤销作业失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 取消作业
 * PUT /api/assignments/:id/cancel
 */
exports.cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);
    
    if (!assignment) {
      return res.status(404).json({ success: false, message: '作业不存在' });
    }
    
    await assignment.update({ status: 'cancelled' });
    
    res.json({ success: true, message: '作业已取消' });
  } catch (error) {
    console.error('取消作业失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 删除作业
 * DELETE /api/assignments/:id
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await Assignment.destroy({ where: { id } });
    res.json({ success: true, message: '作业已删除' });
  } catch (error) {
    console.error('删除作业失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

/**
 * 获取作业统计
 * GET /api/assignments/stats
 */
exports.getStats = async (req, res) => {
  try {
    const total = await Assignment.count();
    const active = await Assignment.count({ where: { status: 'active' } });
    const completed = await Assignment.count({ where: { status: 'completed' } });
    const cancelled = await Assignment.count({ where: { status: 'cancelled' } });
    
    res.json({
      success: true,
      data: { total, active, completed, cancelled }
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};
