const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Schedule = sequelize.define('Schedule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '课程名称'
    },
    subject: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '学科'
    },
    teacher: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '教师/教练'
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '上课地点'
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'day_of_week',
      validate: {
        min: 0,
        max: 6
      },
      comment: '星期几（0=周日, 1=周一, ..., 6=周六）'
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'end_time'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'start_date',
      comment: '课程开始日期'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date',
      comment: '课程结束日期'
    },
    type: {
      type: DataTypes.ENUM('regular', 'special', 'exam', 'activity'),
      defaultValue: 'regular',
      comment: '课程类型：常规课、特殊课程、考试、活动'
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: '#4A90D9',
      comment: '显示颜色（十六进制）'
    },
    status: {
      type: DataTypes.ENUM('active', 'paused', 'completed', 'cancelled'),
      defaultValue: 'active'
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '费用'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    },
    reminderMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reminder_minutes',
      comment: '提前多少分钟提醒'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_to',
      comment: '分配给的家庭成员ID'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      comment: '创建者用户ID'
    }
  }, {
    tableName: 'schedules',
    timestamps: true,
    indexes: [
      { fields: ['day_of_week'] },
      { fields: ['assigned_to'] },
      { fields: ['created_by'] },
      { fields: ['status'] }
    ]
  });

  return Schedule;
};