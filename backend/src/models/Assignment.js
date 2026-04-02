const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Assignment = sequelize.define('Assignment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('homework', 'practice', 'reading', 'sports', 'art', 'other'),
      defaultValue: 'homework'
    },
    subject: {
      type: DataTypes.ENUM('math', 'chinese', 'english', 'science', 'sports', 'art', 'other'),
      defaultValue: 'other'
    },
    // 任务类型：单次、常态化、固定日期
    taskType: {
      type: DataTypes.ENUM('once', 'recurring', 'fixed_date'),
      defaultValue: 'once'
    },
    // 周期类型（常态化任务）
    recurringType: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: true
    },
    // 周几重复（周一=1, 周日=0）
    recurringDays: {
      type: DataTypes.STRING(50), // JSON 数组：[1,3,5] 表示周一三五
      allowNull: true,
      get() {
        const raw = this.getDataValue('recurringDays');
        return raw ? JSON.parse(raw) : [];
      },
      set(val) {
        this.setDataValue('recurringDays', JSON.stringify(val));
      }
    },
    // 固定日期
    fixedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    // 任务时间
    dueTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    // 状态
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      defaultValue: 'active'
    },
    // 布置人
    assignedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_by'
    },
    assignedByName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'assigned_by_name'
    },
    // 布置时间
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'assigned_at'
    },
    // 完成时间
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    },
    // 完成者
    completedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'completed_by'
    },
    // 星星奖励
    starReward: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 5,
      field: 'star_reward'
    },
    // 审核状态：pending-待审核, approved-已通过, rejected-已拒绝
    approvalStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      field: 'approval_status'
    },
    // 审核备注
    approvalNotes: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'approval_notes'
    },
    // 审核人
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'approved_by'
    },
    // 审核时间
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at'
    }
  }, {
    tableName: 'assignments',
    timestamps: true
  });

  return Assignment;
};
