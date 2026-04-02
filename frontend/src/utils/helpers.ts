// ============================================
// 工具函数
// ============================================

import { format, formatDistanceToNow, parseISO, isToday, isTomorrow, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Subject, Priority, StudyPlanStatus, TodoStatus } from '../types';

// --------------------------------------------
// 日期时间处理
// --------------------------------------------

export function formatDate(date: string | Date, formatStr: string = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: zhCN });
}

export function formatTime(date: string | Date, formatStr: string = 'HH:mm'): string {
  return formatDate(date, formatStr);
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function getSmartDateLabel(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(d)) return '今天';
  if (isTomorrow(d)) return '明天';
  if (isYesterday(d)) return '昨天';
  if (isThisWeek(d)) return format(d, 'EEEE', { locale: zhCN });
  if (isThisMonth(d)) return format(d, 'M月d日', { locale: zhCN });
  return format(d, 'yyyy年M月d日', { locale: zhCN });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分钟`;
}

// --------------------------------------------
// 学科与优先级工具
// --------------------------------------------

export function getSubjectColor(subject: Subject): string {
  const colors: Record<Subject, string> = {
    math: '#EF4444',
    chinese: '#F59E0B',
    english: '#3B82F6',
    coding: '#8B5CF6',
    science: '#10B981',
    art: '#EC4899',
    music: '#F97316',
    pe: '#14B8A6',
    other: '#64748B',
  };
  return colors[subject] || '#64748B';
}

export function getSubjectLabel(subject: Subject): string {
  const labels: Record<Subject, string> = {
    math: '数学',
    chinese: '语文',
    english: '英语',
    coding: '编程',
    science: '科学',
    art: '美术',
    music: '音乐',
    pe: '体育',
    other: '其他',
  };
  return labels[subject] || '其他';
}

export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  };
  return colors[priority];
}

export function getPriorityLabel(priority: Priority): string {
  const labels: Record<Priority, string> = {
    high: '高',
    medium: '中',
    low: '低',
  };
  return labels[priority];
}

export function getStatusColor(status: StudyPlanStatus | TodoStatus): string {
  const colors: Record<string, string> = {
    active: '#3B82F6',
    completed: '#10B981',
    pending: '#64748B',
    'in-progress': '#8B5CF6',
  };
  return colors[status] || '#64748B';
}

export function getStatusLabel(status: StudyPlanStatus | TodoStatus): string {
  const labels: Record<string, string> = {
    active: '进行中',
    completed: '已完成',
    pending: '待开始',
    'in-progress': '进行中',
  };
  return labels[status] || '未知';
}

// --------------------------------------------
// 颜色与样式
// --------------------------------------------

export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

// --------------------------------------------
// 字符串处理
// --------------------------------------------

export function truncate(str: string, length: number = 50, suffix: string = '...'): string {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
}

export function stripHtml(html: string): string {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// --------------------------------------------
// 数组与对象处理
// --------------------------------------------

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

// --------------------------------------------
// 进度与统计
// --------------------------------------------

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// --------------------------------------------
// 存储工具
// --------------------------------------------

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
    return defaultValue;
  }
}

export function removeFromStorage(key: string): void {
  localStorage.removeItem(key);
}

// --------------------------------------------
// 验证工具
// --------------------------------------------

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// --------------------------------------------
// 防抖节流
// --------------------------------------------

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (in