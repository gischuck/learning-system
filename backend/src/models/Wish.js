const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Wish = sequelize.define('Wish', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '心愿名称'
    },
    emoji: {
      type: DataTypes.STRING(10),
      defaultValue: '🎁',
      comment: '心愿图标'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '心愿描述'
    },
    starsRequired: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'stars_required',
      comment: '所需星星数'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'completed', 'rejected'),
      defaultValue: 'pending',
      comment: 'pending=待审核, approved=已通过, completed=已兑换, rejected=已拒绝'
    },
    submittedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'submitted_by',
      comment: '提交者（孩子ID，默认为1）'
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reviewed_by',
      comment: '审核者（家长用户ID）'
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by'
    }
  }, {
    tableName: 'wishes',
    timestamps: true,
    underscored: true
  });

  return Wish;
};