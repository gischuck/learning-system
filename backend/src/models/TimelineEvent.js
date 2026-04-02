const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TimelineEvent = sequelize.define('TimelineEvent', {
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
    eventDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'event_date'
    },
    eventTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'event_time'
    },
    eventType: {
      type: DataTypes.ENUM('milestone', 'achievement', 'reminder', 'exam', 'competition', 'activity', 'birthday'),
      allowNull: false,
      field: 'event_type'
    },
    relatedEntity: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'related_entity'
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'related_id'
    },
    importance: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_public'
    },
    mediaUrls: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'media_urls',
      get() {
        const raw = this.getDataValue('mediaUrls');
        return raw ? JSON.parse(raw) : [];
      },
      set(val) {
        this.setDataValue('mediaUrls', JSON.stringify(val));
      }
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
    tableName: 'timeline_events',
    timestamps: true
  });

  return TimelineEvent;
};
