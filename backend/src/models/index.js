const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// 导入模型
const User = require('./User')(sequelize);
const FamilyMember = require('./FamilyMember')(sequelize);
const Plan = require('./Plan')(sequelize);
const Note = require('./Note')(sequelize);
const Todo = require('./Todo')(sequelize);
const Task = require('./Task')(sequelize);
const Schedule = require('./Schedule')(sequelize);
const TimelineEvent = require('./TimelineEvent')(sequelize);
const Assignment = require('./Assignment')(sequelize);
const Wish = require('./Wish')(sequelize);
const StarRecord = require('./StarRecord')(sequelize);
const HabitRecord = require('./HabitRecord')(sequelize);

// 定义关联关系

// User - FamilyMember (1:1 或 1:N)
User.hasOne(FamilyMember, { foreignKey: 'userId', as: 'profile' });
FamilyMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User - Plan (创建者)
User.hasMany(Plan, { foreignKey: 'createdBy', as: 'createdPlans' });
Plan.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// FamilyMember - Plan (分配给谁)
FamilyMember.hasMany(Plan, { foreignKey: 'assignedTo', as: 'assignedPlans' });
Plan.belongsTo(FamilyMember, { foreignKey: 'assignedTo', as: 'assignee' });

// User - Note
User.hasMany(Note, { foreignKey: 'createdBy', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Plan - Note
Plan.hasMany(Note, { foreignKey: 'relatedPlanId', as: 'relatedNotes' });
Note.belongsTo(Plan, { foreignKey: 'relatedPlanId', as: 'relatedPlan' });

// FamilyMember - Note
FamilyMember.hasMany(Note, { foreignKey: 'relatedMemberId', as: 'memberNotes' });
Note.belongsTo(FamilyMember, { foreignKey: 'relatedMemberId', as: 'relatedMember' });

// User - Todo (创建者)
User.hasMany(Todo, { foreignKey: 'createdBy', as: 'createdTodos' });
Todo.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// User - Todo (完成者)
User.hasMany(Todo, { foreignKey: 'completedBy', as: 'completedTodos' });
Todo.belongsTo(User, { foreignKey: 'completedBy', as: 'completer' });

// FamilyMember - Todo (分配给谁)
FamilyMember.hasMany(Todo, { foreignKey: 'assignedTo', as: 'todos' });
Todo.belongsTo(FamilyMember, { foreignKey: 'assignedTo', as: 'assignee' });

// Plan - Todo
Plan.hasMany(Todo, { foreignKey: 'planId', as: 'todos' });
Todo.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });

// User - Task (创建者)
User.hasMany(Task, { foreignKey: 'createdBy', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// FamilyMember - Task (分配给孩子)
FamilyMember.hasMany(Task, { foreignKey: 'assignedTo', as: 'assignedTasks' });
Task.belongsTo(FamilyMember, { foreignKey: 'assignedTo', as: 'assignee' });

// Plan - Task
Plan.hasMany(Task, { foreignKey: 'planId', as: 'tasks' });
Task.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });

// User - Schedule (创建者)
User.hasMany(Schedule, { foreignKey: 'createdBy', as: 'createdSchedules' });
Schedule.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// FamilyMember - Schedule (分配给孩子)
FamilyMember.hasMany(Schedule, { foreignKey: 'assignedTo', as: 'schedules' });
Schedule.belongsTo(FamilyMember, { foreignKey: 'assignedTo', as: 'assignee' });

// User - TimelineEvent
User.hasMany(TimelineEvent, { foreignKey: 'createdBy', as: 'events' });
TimelineEvent.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// User - Wish
User.hasMany(Wish, { foreignKey: 'createdBy', as: 'wishes' });
Wish.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// User - StarRecord
User.hasMany(StarRecord, { foreignKey: 'childId', as: 'starRecords' });
StarRecord.belongsTo(User, { foreignKey: 'childId', as: 'child' });

// User - HabitRecord
User.hasMany(HabitRecord, { foreignKey: 'childId', as: 'habitRecords' });
HabitRecord.belongsTo(User, { foreignKey: 'childId', as: 'child' });

module.exports = {
  sequelize,
  Op,
  User,
  FamilyMember,
  Plan,
  Note,
  Todo,
  Task,
  Schedule,
  TimelineEvent,
  Assignment,
  Wish,
  StarRecord,
  HabitRecord
};