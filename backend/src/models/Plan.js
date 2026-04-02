const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Plan = sequelize.define('Plan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      validate: {
        len: [0, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('course', 'competition', 'activity', 'exam', 'reading'),
      allowNull: true,
      defaultValue: 'course'
    },
    subject: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date'
    },
    status: {
      type: DataTypes.ENUM('planned', 'active', 'completed', 'cancelled', 'paused'),
      defaultValue: 'planned'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by'
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
    targetScore: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'target_score'
    },
    actualScore: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'actual_score'
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    teacher: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('tags');
        return raw ? JSON.parse(raw) : [];
      },
      set(val) {
        this.setDataValue('tags', JSON.stringify(val));
      }
    }
  }, {
    tableName: 'plans',
    timestamps: true
  });

  return Plan;
};
