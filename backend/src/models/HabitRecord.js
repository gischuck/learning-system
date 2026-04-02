const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HabitRecord = sequelize.define('HabitRecord', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    childId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'child_id',
      comment: '孩子ID'
    },
    habitType: {
      type: DataTypes.ENUM('early_sleep', 'early_wake', 'pack_bag', 'play_game', 'watch_tv', 'incomplete_homework', 'other'),
      allowNull: false,
      field: 'habit_type',
      comment: 'early_sleep=早睡, early_wake=早起, pack_bag=收书包, play_game=玩游戏, watch_tv=偷看电视, incomplete_homework=未完成学校作业'
    },
    recordDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'record_date',
      comment: '记录日期'
    },
    status: {
      type: DataTypes.ENUM('completed', 'failed', 'skipped'),
      allowNull: false,
      defaultValue: 'completed',
      comment: 'completed=完成, failed=未完成, skipped=跳过'
    },
    starsEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'stars_earned',
      comment: '获得/扣除的星星数'
    },
    note: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '备注'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by'
    }
  }, {
    tableName: 'habit_records',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['child_id', 'record_date', 'habit_type'], unique: true },
      { fields: ['record_date'] }
    ]
  });

  return HabitRecord;
};