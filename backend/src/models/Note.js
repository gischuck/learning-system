const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Note = sequelize.define('Note', {
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(50),
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
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_public'
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_pinned'
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'view_count'
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
    relatedPlanId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'related_plan_id',
      references: {
        model: 'plans',
        key: 'id'
      }
    },
    relatedMemberId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'related_member_id',
      references: {
        model: 'family_members',
        key: 'id'
      }
    }
  }, {
    tableName: 'notes',
    timestamps: true
  });

  return Note;
};
