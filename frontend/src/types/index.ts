// ============================================
// William家庭学习系统 - 类型定义
// ============================================

// --------------------------------------------
// 基础类型
// --------------------------------------------

export type StudyPlanType = 'course' | 'competition' | 'activity';
export type StudyPlanStatus = 'active' | 'completed' | 'pending';
export type Priority = 'low' | 'medium' | 'high';
export type TodoStatus = 'pending' | 'in-progress' | 'completed';
export type TimelineEventType = 'milestone' | 'achievement' | 'competition' | 'exam' | 'activity';
export type MemberRole = 'parent' | 'child' | 'other';

// --------------------------------------------
// 学科类型
// --------------------------------------------

export type Subject = 'math' | 'chinese' | 'english' | 'coding' | 'science' | 'art' | 'music' | 'pe' | 'other';

export const SUBJECT_CONFIG: Record<Subject, { label: string; color: string; icon: string }> = {
  math: { label: '数学', color: '#EF4444', icon: 'Calculator' },
  chinese: { label: '语文', color: '#F59E0B', icon: 'BookOpen' },
  english: { label: '英语', color: '#3B82F6', icon: 'Languages' },
  coding: { label: '编程', color: '#8B5CF6', icon: 'Code' },
  science: { label: '科学', color: '#10B981', icon: 'FlaskConical' },
  art: { label: '美术', color: '#EC4899', icon: 'Palette' },
  music: { label: '音乐', color: '#F97316', icon: 'Music' },
  pe: { label: '体育', color: '#14B8A6', icon: 'Activity' },
  other: { label: '其他', color: '#64748B', icon: 'MoreHorizontal' },
};

// --------------------------------------------
// 学习规划
// --------------------------------------------

export interface Schedule {
  dayOfWeek: number[];  // 0-6, 0 = Sunday
  startTime: string;    // HH:mm
  endTime: string;      // HH:mm
  startDate?: Date;
  endDate?: Date;
}

export interface StudyPlan {
  id: string;
  title: string;
  type: StudyPlanType;
  subject: Subject;
  schedule: Schedule;
  location?: string;
  teacher?: string;
  status: StudyPlanStatus;
  progress: number;     // 0-100
  notes?: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------
// 时间线事件
// --------------------------------------------

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  type: TimelineEventType;
  description?: string;
  icon?: string;
  color?: string;
  tags: string[];
  relatedMembers: string[];
  images?: string[];
  createdAt: string;
}

// --------------------------------------------
// 待办事项
// --------------------------------------------

export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TodoStatus;
  dueDate?: string;
  assignee?: string;
  tags: string[];
  relatedPlan?: string;  // 关联的学习计划ID
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

// --------------------------------------------
// 笔记
// --------------------------------------------

export interface Note {
  id: string;
  title: string;
  content: string;      // HTML or JSON
  summary?: string;
  category: string;
  tags: string[];
  author: string;
  isShared: boolean;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

// --------------------------------------------
// 家庭成员
// --------------------------------------------

export interface FamilyMember {
  id: string;
  name: string;
  role: MemberRole;
  avatar?: string;
  color: string;
  email?: string;
}

// --------------------------------------------
// 统计数据
// --------------------------------------------

export interface DashboardStats {
  totalPlans: number;
  activePlans: number;
  completedTodos: number;
  pendingTodos: number;
  totalNotes: number;
  upcomingEvents: number;
  weeklyProgress: number;
}

// --------------------------------------------
// 过滤与排序
// --------------------------------------------

export interface FilterOptions {
  status?: string;
  subject?: Subject;
  priority?: Priority;
  type?: string;
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  assignee?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// --------------------------------------------
// API响应类型
// --------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// --------------------------------------------
// UI状态类型
// --------------------------------------------

export interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  currentView: string;
  filters: Record<string, FilterOptions>;
}

// --------------------------------------------
// 用户会话
// --------------------------------------------

export interface UserSession {
  user: FamilyMember;
  token: string;
  expiresAt: string;
}
