const { Schedule, User, FamilyMember } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取课程表
 * GET /api/schedules
 * 查询参数：dayOfWeek, assignedTo, status, type
 */
exports.getAll = async (req, res) => {
  try {
    const { dayOfWeek, assignedTo, status, type } = req.query;
    const where = {};

    if (dayOfWeek !== undefined) where.dayOfWeek = parseInt(dayOfWeek);
    if (assignedTo) where.assignedTo = assignedTo;
    if (status) where.status = status;
    if (type) where.type = type;

    const schedules = await Schedule.findAll({
      where,
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
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
      data: schedules
    });
  } catch (error) {
    console.error('获取课程表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取课程表失败'
    });
  }
};

/**
 * 获取按周分组的课程表
 * GET /api/schedules/weekly
 */
exports.getWeekly = async (req, res) => {
  try {
    const { assignedTo, status } = req.query;
    const where = {};

    if (assignedTo) where.assignedTo = assignedTo;
    if (status) where.status = status;
    else where.status = 'active';

    const schedules = await Schedule.findAll({
      where,
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
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

    // 按周几分组
    const weeklySchedule = {
      0: [], // 周日
      1: [], // 周一
      2: [], // 周二
      3: [], // 周三
      4: [], // 周四
      5: [], // 周五
      6: []  // 周六
    };

    schedules.forEach(schedule => {
      weeklySchedule[schedule.dayOfWeek].push(schedule);
    });

    // 转换为中文格式
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const result = Object.keys(weeklySchedule).map(day => ({
      dayOfWeek: parseInt(day),
      dayName: dayNames[day],
      courses: weeklySchedule[day]
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取周课程表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取周课程表失败'
    });
  }
};

/**
 * 获取今日课程
 * GET /api/schedules/today
 */
exports.getToday = async (req, res) => {
  try {
    const today = new Date().getDay(); // 0-6
    const { assignedTo } = req.query;
    const where = {
      dayOfWeek: today,
      status: 'active'
    };

    if (assignedTo) where.assignedTo = assignedTo;

    const schedules = await Schedule.findAll({
      where,
      order: [['startTime', 'ASC']],
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
      data: {
        dayOfWeek: today,
        dayName: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today],
        date: new Date().toISOString().split('T')[0],
        courses: schedules
      }
    });
  } catch (error) {
    console.error('获取今日课程错误:', error);
    res.status(500).json({
      success: false,
      message: '获取今日课程失败'
    });
  }
};

/**
 * 获取单个课程
 * GET /api/schedules/:id
 */
exports.getById = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id, {
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

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('获取课程详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取课程详情失败'
    });
  }
};

/**
 * 创建课程
 * POST /api/schedules
 * 需要登录
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
      subject,
      teacher,
      location,
      dayOfWeek,
      startTime,
      endTime,
      startDate,
      endDate,
      type,
      color,
      cost,
      notes,
      reminderMinutes,
      assignedTo
    } = req.body;

    // 验证必填字段
    if (!title || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: '请填写课程名称、星期几、开始时间和结束时间'
      });
    }

    // 验证时间
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: '结束时间必须晚于开始时间'
      });
    }

    // 检查时间冲突
    const conflict = await Schedule.findOne({
      where: {
        dayOfWeek,
        status: 'active',
        [Op.or]: [
          {
            startTime: { [Op.lt]: endTime },
            endTime: { [Op.gt]: startTime }
          }
        ]
      }
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: '该时间段已有其他课程安排'
      });
    }

    const schedule = await Schedule.create({
      title,
      subject,
      teacher,
      location,
      dayOfWeek,
      startTime,
      endTime,
      startDate,
      endDate,
      type: type || 'regular',
      color: color || '#4A90D9',
      cost,
      notes,
      reminderMinutes,
      assignedTo,
      createdBy: req.user.id
    });

    const newSchedule = await Schedule.findByPk(schedule.id, {
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
      message: '课程创建成功',
      data: newSchedule
    });
  } catch (error) {
    console.error('创建课程错误:', error);
    res.status(500).json({
      success: false,
      message: '创建课程失败'
    });
  }
};

/**
 * 更新课程
 * PUT /api/schedules/:id
 * 需要登录
 */
exports.update = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }

    const { startTime, endTime, dayOfWeek } = req.body;

    // 检查时间冲突（排除自身）
    if ((startTime && endTime) || dayOfWeek !== undefined) {
      const checkDay = dayOfWeek !== undefined ? dayOfWeek : schedule.dayOfWeek;
      const checkStart = startTime || schedule.startTime;
      const checkEnd = endTime || schedule.endTime;

      if (checkStart >= checkEnd) {
        return res.status(400).json({
          success: false,
          message: '结束时间必须晚于开始时间'
        });
      }

      const conflict = await Schedule.findOne({
        where: {
          dayOfWeek: checkDay,
          status: 'active',
          id: { [Op.ne]: schedule.id },
          [Op.or]: [
            {
              startTime: { [Op.lt]: checkEnd },
              endTime: { [Op.gt]: checkStart }
            }
          ]
        }
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: '该时间段已有其他课程安排'
        });
      }
    }

    await schedule.update(req.body);

    const updatedSchedule = await Schedule.findByPk(schedule.id, {
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
      message: '课程更新成功',
      data: updatedSchedule
    });
  } catch (error) {
    console.error('更新课程错误:', error);
    res.status(500).json({
      success: false,
      message: '更新课程失败'
    });
  }
};

/**
 * 删除课程
 * DELETE /api/schedules/:id
 * 需要登录
 */
exports.delete = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }

    await schedule.destroy();

    res.json({
      success: true,
      message: '课程已删除'
    });
  } catch (error) {
    console.error('删除课程错误:', error);
    res.status(500).json({
      success: false,
      message: '删除课程失败'
    });
  }
};

/**
 * 批量创建课程（课程表导入）
 * POST /api/schedules/batch
 * 需要登录
 */
exports.batchCreate = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const { courses } = req.body;

    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供课程列表'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const course of courses) {
      try {
        const { title, dayOfWeek, startTime, endTime } = course;

        if (!title || dayOfWeek === undefined || !startTime || !endTime) {
          results.failed.push({ course, reason: '缺少必填字段' });
          continue;
        }

        const schedule = await Schedule.create({
          ...course,
          createdBy: req.user.id
        });

        results.success.push(schedule);
      } catch (err) {
        results.failed.push({ course, reason: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `成功创建 ${results.success.length} 个课程，失败 ${results.failed.length} 个`,
      data: results
    });
  } catch (error) {
    console.error('批量创建课程错误:', error);
    res.status(500).json({
      success: false,
      message: '批量创建课程失败'
    });
  }
};

/**
 * 获取课程统计
 * GET /api/schedules/stats
 */
exports.getStats = async (req, res) => {
  try {
    const { assignedTo } = req.query;
    const where = { status: 'active' };

    if (assignedTo) where.assignedTo = assignedTo;

    // 按星期统计
    const byDay = await Schedule.findAll({
      where,
      attributes: [
        'dayOfWeek',
        [Schedule.sequelize.fn('COUNT', Schedule.sequelize.col('id')), 'count']
      ],
      group: ['dayOfWeek']
    });

    // 按类型统计
    const byType = await Schedule.findAll({
      where,
      attributes: [
        'type',
        [Schedule.sequelize.fn('COUNT', Schedule.sequelize.col('id')), 'count']
      ],
      group: ['type']
    });

    // 总数
    const total = await Schedule.count({ where });

    // 计算每周总课时
    const totalHours = await Schedule.sum(
      Schedule.sequelize.literal(
        "(strftime('%s', end_time) - strftime('%s', start_time)) / 3600.0"
      ),
      { where }
    );

    const result = {
      total,
      totalHours: totalHours ? Math.round(totalHours * 10) / 10 : 0,
      byDay: {},
      byType: {}
    };

    byDay.forEach(s => {
      result.byDay[s.dayOfWeek] = parseInt(s.dataValues.count);
    });

    byType.forEach(s => {
      result.byType[s.type] = parseInt(s.dataValues.count);
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取课程统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取课程统计失败'
    });
  }
};