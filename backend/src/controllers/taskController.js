const { Task, User, FamilyMember, Plan } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取任务列表
 * GET /api/tasks
 * 查询参数：status, assignedTo, category, startDate, endDate
 */
exports.getAll = async (req, res) => {
  try {
    const { status, assignedTo, category, startDate, endDate } = req.query;
    const where = {};

    // 权限控制：未登录用户只能看到分配给孩子的任务
    // 已登录用户可以看到所有任务
    if (!req.user) {
      // 未登录用户只能查看分配给孩子的任务
      where.assignedTo = { [Op.ne]: null };
    }

    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;
    if (category) where.category = category;
    if (startDate && endDate) {
      where.dueDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.dueDate = { [Op.gte]: startDate };
    } else if (endDate) {
      where.dueDate = { [Op.lte]: endDate };
    }

    const tasks = await Task.findAll({
      where,
      order: [
        ['dueDate', 'ASC'],
        ['priority', 'DESC']
      ],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'displayName', 'avatar']
        },
        {
          model: FamilyMember,
          as: 'assignee',
          attributes: ['id', 'name', 'relation', 'avatar']
        }
      ]
    });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('获取任务列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取任务列表失败'
    });
  }
};

/**
 * 获取单个任务
 * GET /api/tasks/:id
 */
exports.getById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'displayName', 'avatar']
        },
        {
          model: FamilyMember,
          as: 'assignee',
          attributes: ['id', 'name', 'relation', 'avatar']
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('获取任务详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取任务详情失败'
    });
  }
};

/**
 * 创建任务
 * POST /api/tasks
 * 需要登录（家长权限）
 */
exports.create = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const {
      title,
      description,
      category,
      subject,
      difficulty,
      priority,
      dueDate,
      dueTime,
      estimatedMinutes,
      points,
      reward,
      parentNote,
      assignedTo,
      planId,
      isRecurring,
      recurringRule
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: '任务标题不能为空'
      });
    }

    const task = await Task.create({
      title,
      description,
      category: category || 'study',
      subject,
      difficulty: difficulty || 'medium',
      priority: priority || 'medium',
      dueDate,
      dueTime,
      estimatedMinutes,
      points: points || 10,
      reward,
      parentNote,
      assignedTo,
      planId,
      isRecurring: isRecurring || false,
      recurringRule,
      createdBy: req.user.id
    });

    // 返回创建的任务（包含关联数据）
    const newTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'displayName', 'avatar']
        },
        {
          model: FamilyMember,
          as: 'assignee',
          attributes: ['id', 'name', 'relation', 'avatar']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '任务创建成功',
      data: newTask
    });
  } catch (error) {
    console.error('创建任务错误:', error);
    res.status(500).json({
      success: false,
      message: '创建任务失败'
    });
  }
};

/**
 * 更新任务
 * PUT /api/tasks/:id
 */
exports.update = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 权限检查
    if (!req.user) {
      // 未登录用户只能更新状态（打勾完成任务）
      const allowedFields = ['status'];
      const updateFields = Object.keys(req.body);
      const hasOtherFields = updateFields.some(f => !allowedFields.includes(f));
      
      if (hasOtherFields) {
        return res.status(403).json({
          success: false,
          message: '未登录用户只能更新任务状态'
        });
      }

      // 只能将状态改为completed
      if (req.body.status === 'completed') {
        await task.update({
          status: 'completed',
          completedAt: new Date()
        });
      } else {
        return res.status(403).json({
          success: false,
          message: '未登录用户只能完成任务'
        });
      }
    } else {
      // 已登录用户可以更新所有字段
      const updateData = { ...req.body };
      
      // 如果状态变为completed，记录完成时间
      if (updateData.status === 'completed' && task.status !== 'completed') {
        updateData.completedAt = new Date();
      }
      
      await task.update(updateData);
    }

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'displayName', 'avatar']
        },
        {
          model: FamilyMember,
          as: 'assignee',
          attributes: ['id', 'name', 'relation', 'avatar']
        }
      ]
    });

    res.json({
      success: true,
      message: '任务更新成功',
      data: updatedTask
    });
  } catch (error) {
    console.error('更新任务错误:', error);
    res.status(500).json({
      success: false,
      message: '更新任务失败'
    });
  }
};

/**
 * 删除任务
 * DELETE /api/tasks/:id
 * 需要登录（家长权限）
 */
exports.delete = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    await task.destroy();

    res.json({
      success: true,
      message: '任务已删除'
    });
  } catch (error) {
    console.error('删除任务错误:', error);
    res.status(500).json({
      success: false,
      message: '删除任务失败'
    });
  }
};

/**
 * 切换任务完成状态
 * PATCH /api/tasks/:id/toggle
 */
exports.toggleComplete = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    await task.update({
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date() : null
    });

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'displayName', 'avatar']
        },
        {
          model: FamilyMember,
          as: 'assignee',
          attributes: ['id', 'name', 'relation', 'avatar']
        }
      ]
    });

    res.json({
      success: true,
      message: newStatus === 'completed' ? '任务已完成' : '任务已重新开启',
      data: updatedTask
    });
  } catch (error) {
    console.error('切换任务状态错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
};

/**
 * 获取今日任务
 * GET /api/tasks/today
 */
exports.getToday = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const tasks = await Task.findAll({
      where: {
        dueDate: today,
        status: { [Op.ne]: 'cancelled' }
      },
      order: [
        ['priority', 'DESC'],
        ['dueTime', 'ASC']
      ],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'displayName', 'avatar']
        },
        {
          model: FamilyMember,
          as: 'assignee',
          attributes: ['id', 'name', 'relation', 'avatar']
        }
      ]
    });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('获取今日任务错误:', error);
    res.status(500).json({
      success: false,
      message: '获取今日任务失败'
    });
  }
};

/**
 * 获取任务统计
 * GET /api/tasks/stats
 */
exports.getStats = async (req, res) => {
  try {
    const { assignedTo } = req.query;
    const where = {};
    
    if (assignedTo) where.assignedTo = assignedTo;

    const stats = await Task.findAll({
      where,
      attributes: [
        'status',
        [Task.sequelize.fn('COUNT', Task.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const totalPoints = await Task.sum('points', {
      where: { ...where, status: 'completed' }
    }) || 0;

    const result = {
      byStatus: {},
      totalCompleted: 0,
      totalPoints
    };

    stats.forEach(s => {
      result.byStatus[s.status] = parseInt(s.dataValues.count);
      if (s.status === 'completed') {
        result.totalCompleted = parseInt(s.dataValues.count);
      }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取任务统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取任务统计失败'
    });
  }
};