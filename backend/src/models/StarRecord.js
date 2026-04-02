const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StarRecord = sequelize.define('StarRecord', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    childId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'child_id',
      comment: '孩子ID（0表示家长操作，不关联孩子）'
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '变动数量（正数为获得，负数为扣除）'
    },
    balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '变动后余额'
    },
    type: {
      type: DataTypes.ENUM('assignment', 'habit', 'wish', 'manual', 'other'),
      allowNull: false,
      comment: 'assignment=作业, habit=习惯, wish=兑换, manual=手动, other=其他'
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reference_id',
      comment: '关联ID（作业ID/习惯记录ID/心愿ID）'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '说明'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      comment: '操作者ID'
    }
  }, {
    tableName: 'star_records',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['child_id'] },
      { fields: ['type'] },
      { fields: ['created_at'] }
    ]
  });

  return StarRecord;
};