// ============================================
// 常量定义
// ============================================

// 家庭成员配置
export const FAMILY_MEMBERS = [
  { id: 'dad', name: '爸爸', role: 'parent', color: '#3B82F6', emoji: '👨' },
  { id: 'mom', name: '妈妈', role: 'parent', color: '#EC4899', emoji: '👩' },
  { id: 'william', name: 'William', role: 'child', color: '#10B981', emoji: '👦' },
];

// 优先级配置
export const PRIORITY_CONFIG = {
  high: { label: '高优先级', color: '#EF4444', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  medium: { label: '中优先级', color: '#F59E0B', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  low: { label: '低优先级', color: '#10B981', bgColor: 'bg-green-100', textColor: 'text-green-700' },
};

// 状态配置
export const STATUS_CONFIG = {
  active: { label: '进行中', color: '#3B82F6', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  completed: { label: '已完成', color: '#10B981', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  pending: { label: '待开始', color: '#64748B', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
  'in-progress': { label: '进行中', color: '#8B5CF6', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
};

// 计划类型配置
export const PLAN_TYPE_CONFIG = {
  course: { label: '课程', icon: 'BookOpen', color: '#3B82F6' },
  competition: { label: '比赛', icon: 'Trophy', color: '#F59E0B' },
  activity: { label: '活动', icon: 'Calendar', color: '#10B981' },
};

// 时间线事件类型配置
export const TIMELINE_TYPE_CONFIG = {
  milestone: { label: '里程碑', icon: 'Flag', color: '#8B5CF6' },
  achievement: { label: '成就', icon: 'Star', color: '#F59E0B' },
  competition: { label: '比赛', icon: 'Trophy', color: '#EF4444' },
  exam: { label: '考试', icon: 'FileText', color: '#3B82F6' },
  activity: { label: '活动', icon: 'Users', color: '#10B981' },
};

// 笔记分类
export const NOTE_CATEGORIES = [
  { id: 'learning', label: '学习心得', icon: 'Lightbulb' },
  { id: 'parenting', label: '育儿经验', icon: 'Heart' },
  { id: 'method', label: '方法总结', icon: 'Target' },
  { id: 'reflection', label: '反思记录', icon: 'MessageSquare' },
  { id: 'plan', label: '规划思考', icon: 'Calendar' },
  { id: 'other', label: '其他', icon: 'MoreHorizontal' },
];

// 星期名称
export const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 学科列表
export const SUBJECTS = [
  { id: 'math', label: '数学', color: '#EF4444' },
  { id: 'chinese', label: '语文', color: '#F59E0B' },
  { id: 'english', label: '英语', color: '#3B82F6' },
  { id: 'coding', label: '编程', color: '#8B5CF6' },
  { id: 'science', label: '科学', color: '#10B981' },
  { id: 'art', label: '美术', color: '#EC4899' },
  { id: 'music', label: '音乐', color: '#F97316' },
  { id: 'pe', label: '体育', color: '#14B8A6' },
];

// 常用标签
export const COMMON_TAGS = [
  '奥数', '英语', '语文', '编程', '科学', '艺术', '体育',
  '点招', '小升初', '竞赛', '考级', '习惯', '方法', '心得'
];

// 视图模式
export const VIEW_MODES = {
  calendar: { label: '日历视图', icon: 'Calendar' },
  list: { label: '列表视图', icon: 'List' },
  timeline: { label: '时间线视图', icon: 'Clock' },
};

// API 端点基础路径
export const API_BASE_URL = process.env.VITE_API_URL || '/api';

// 分页配置
export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
};

// 本地存储键名
export const STORAGE_KEYS = {
  user: 'william_study_user',
  theme: 'william_study_theme',
  sidebar: 'william_study_sidebar',
  draft: 'william_study_draft',
};
