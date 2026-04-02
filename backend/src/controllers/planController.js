const { Plan, User, FamilyMember } = require('../models');

/**
 * 获取所有学习规划
 * GET /api/plans
 */
exports.getAll = async (req, res) => {
  try {
    const { status, type, assignedTo } = req.query;
    const where = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (assignedTo) where.assignedTo = assignedTo;

    const plans = await Plan.findAll({
      where,
      order: [['createdAt', 'DESC']],
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
      data: plans
    });
  } catch (error) {
    console.error('获取规划列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取规划列表失败'
    });
  }
};

/**
 * 获取单个规划
 * GET /api/plans/:id
 */
exports.getById = async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id, {
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

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '规划不存在'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('获取规划详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取规划详情失败'
    });
  }
};

/**
 * 创建规划
 * POST /api/plans
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
      type,
      subject,
      startDate,
      endDate,
      priority,
      targetScore,
      location,
      teacher,
      cost,
      tags,
      assignedTo
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: '规划标题不能为空'
      });
    }

    const plan = await Plan.create({
      title,
      description,
      type: type || 'course',
      subject,
      startDate,
      endDate,
      priority: priority || 'medium',
      targetScore,
      location,
      teacher,
      cost,
      tags: tags || [],
      assignedTo,
      createdBy: req.user.id
    });

    const newPlan = await Plan.findByPk(plan.id, {
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
      message: '规划创建成功',
      data: newPlan
    });
  } catch (error) {
    console.error('创建规划错误:', error);
    res.status(500).json({
      success: false,
      message: '创建规划失败'
    });
  }
};

/**
 * 更新规划
 * PUT /api/plans/:id
 */
exports.update = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const plan = await Plan.findByPk(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '规划不存在'
      });
    }

    await plan.update(req.body);

    const updatedPlan = await Plan.findByPk(plan.id, {
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
      message: '规划更新成功',
      data: updatedPlan
    });
  } catch (error) {
    console.error('更新规划错误:', error);
    res.status(500).json({
      success: false,
      message: '更新规划失败'
    });
  }
};

/**
 * 删除规划
 * DELETE /api/plans/:id
 */
exports.delete = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const plan = await Plan.findByPk(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '规划不存在'
      });
    }

    await plan.destroy();

    res.json({
      success: true,
      message: '规划已删除'
    });
  } catch (error) {
    console.error('删除规划错误:', error);
    res.status(500).json({
      success: false,
      message: '删除规划失败'
    });
  }
};