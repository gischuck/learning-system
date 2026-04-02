const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FamilyMember = sequelize.define('FamilyMember', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    relation: {
      type: DataTypes.ENUM('father', 'mother', 'child', 'other'),
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    school: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    grade: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    currentSchool: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'current_school'
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'family_members',
    timestamps: true
  });

  return FamilyMember;
};
