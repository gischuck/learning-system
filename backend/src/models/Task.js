const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('study', 'exercise', 'reading', 'chore', 'hobby', 'other'),
      defaultValue: 'study',
      comment: '任务类型'
    },
    subject: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '学科（如数学、语文等）'
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'due_date'
    },
    dueTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'due_time'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    },
    estimatedMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'estimated_minutes',
      comment: '预估完成时长（分钟）'
    },
    actualMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'actual_minutes',
      comment: '实际完成时长（分钟）'
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      comment: '完成任务获得的积分'
    },
    reward: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '完成奖励'
    },
    parentNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'parent_note',
      comment: '家长备注'
    },
    childNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'child_note',
      comment: '孩子备注'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_to',
      comment: '分配给的家庭成员ID（孩子）'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      comment: '创建者用户ID（家长）'
    },
    planId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'plan_id',
      comment: '关联的学习规划ID'
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_recurring'
    },
    recurringRule: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'recurring_rule',
      comment: '重复规则（cron格式）'
    },
    attachments: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('attachments');
        return raw ? JSON.parse(raw) : [];
      },
      set(val) {
        this.setDataValue('attachments', JSON.stringify(val || []));
      }
    }
  }, {
    tableName: 'tasks',
    timestamps: true,
    indexes: [
      { fields: ['assigned_to'] },
      { fields: ['created_by'] },
      { fields: ['status'] },
      { fields: ['due_date'] }
    ]
  });

  return Task;
};