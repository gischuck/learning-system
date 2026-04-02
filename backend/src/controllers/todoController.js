const { Todo, User, FamilyMember, Plan } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取所有待办事项
 * GET /api/todos
 */
exports.getAll = async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.query;
    const where = {};

    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;
    if (priority) where.priority = priority;

    const todos = await Todo.findAll({
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
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'type']
        }
      ]
    });

    res.json({
      success: true,
      data: todos
    });
  } catch (error) {
    console.error('获取待办列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取待办列表失败'
    });
  }
};

/**
 * 获取单个待办
 * GET /api/todos/:id
 */
exports.getById = async (req, res) => {
  try {
    const todo = await Todo.findByPk(req.params.id, {
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
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'type']
        }
      ]
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '待办不存在'
      });
    }

    res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    console.error('获取待办详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取待办详情失败'
    });
  }
};

/**
 * 创建待办
 * POST /api/todos
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
      dueDate,
      dueTime,
      priority,
      assignedTo,
      planId,
      reminderMinutes,
      isRecurring,
      recurringRule
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: '待办标题不能为空'
      });
    }

    const todo = await Todo.create({
      title,
      description,
      dueDate,
      dueTime,
      priority: priority || 'medium',
      assignedTo,
      planId,
      reminderMinutes,
      isRecurring: isRecurring || false,
      recurringRule,
      createdBy: req.user.id
    });

    const newTodo = await Todo.findByPk(todo.id, {
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
      message: '待办创建成功',
      data: newTodo
    });
  } catch (error) {
    console.error('创建待办错误:', error);
    res.status(500).json({
      success: false,
      message: '创建待办失败'
    });
  }
};

/**
 * 更新待办
 * PUT /api/todos/:id
 */
exports.update = async (req, res) => {
  try {
    const todo = await Todo.findByPk(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '待办不存在'
      });
    }

    // 权限检查：未登录用户只能更新状态和审核状态
    if (!req.user) {
      const allowedFields = ['status', 'approvalStatus'];
      const updateFields = Object.keys(req.body);
      const hasOtherFields = updateFields.some(f => !allowedFields.includes(f));

      if (hasOtherFields) {
        return res.status(403).json({
          success: false,
          message: '未登录用户只能更新待办状态'
        });
      }

      // 允许完成和撤销操作
      if (req.body.status === 'completed') {
        await todo.update({
          status: 'completed',
          approvalStatus: req.body.approvalStatus || 'pending',
          completedAt: new Date()
        });
      } else if (req.body.status === 'pending' || req.body.status === 'active') {
        // 撤销操作：恢复为未完成状态
        await todo.update({
          status: 'pending',
          approvalStatus: req.body.approvalStatus || null,
          completedAt: null
        });
      } else {
        await todo.update(req.body);
      }
    } else {
      // 已登录用户可以更新所有字段
      const updateData = { ...req.body };

      if (updateData.status === 'completed' && todo.status !== 'completed') {
        updateData.completedAt = new Date();
        updateData.completedBy = req.user.id;
      }

      await todo.update(updateData);
    }

    const updatedTodo = await Todo.findByPk(todo.id, {
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
      message: '待办更新成功',
      data: updatedTodo
    });
  } catch (error) {
    console.error('更新待办错误:', error);
    res.status(500).json({
      success: false,
      message: '更新待办失败'
    });
  }
};

/**
 * 删除待办
 * DELETE /api/todos/:id
 */
exports.delete = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const todo = await Todo.findByPk(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '待办不存在'
      });
    }

    await todo.destroy();

    res.json({
      success: true,
      message: '待办已删除'
    });
  } catch (error) {
    console.error('删除待办错误:', error);
    res.status(500).json({
      success: false,
      message: '删除待办失败'
    });
  }
};

/**
 * 切换待办完成状态
 * PATCH /api/todos/:id/toggle
 */
exports.toggleStatus = async (req, res) => {
  try {
    const todo = await Todo.findByPk(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '待办不存在'
      });
    }

    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';

    await todo.update({
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date() : null,
      completedBy: newStatus === 'completed' && req.user ? req.user.id : null
    });

    const updatedTodo = await Todo.findByPk(todo.id, {
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
      message: newStatus === 'completed' ? '待办已完成' : '待办已重新开启',
      data: updatedTodo
    });
  } catch (error) {
    console.error('切换待办状态错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
};