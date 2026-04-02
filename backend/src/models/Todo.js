const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Todo = sequelize.define('Todo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      validate: {
        len: [1, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '其他'
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
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_to',
      references: {
        model: 'family_members',
        key: 'id'
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    planId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'plan_id',
      references: {
        model: 'plans',
        key: 'id'
      }
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    },
    completedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'completed_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reminderMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reminder_minutes'
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_recurring'
    },
    recurringRule: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'recurring_rule'
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2,
      comment: '完成任务获得的星星数'
    },
    // 审核状态
    approvalStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      field: 'approval_status'
    },
    approvalNotes: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'approval_notes'
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'approved_by'
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at'
    },
    // 是否在孩子看板展示
    showOnKidBoard: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'show_on_kid_board',
      comment: '是否在孩子看板展示（默认不展示）'
    }
  }, {
    tableName: 'todos',
    timestamps: true
  });

  return Todo;
};
