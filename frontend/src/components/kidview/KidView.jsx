import React, { useState, useEffect } from 'react';
import { getTodayQuote } from '../../utils/quotes';

// 学校课程表（周一到周日）- 与 Plans.jsx 保持一致
const schoolSchedule = [
  { day: 1, courses: ['数学', '科学', '道德与法治', '班队会', '体育', '信息科技'] },
  { day: 2, courses: ['语文', '数学', '书法', '美术', '艺术欣赏', '跳绳', 'C++ 普及班'] },
  { day: 3, courses: ['数学实践', '语文', '英语', '道德与法治', '体育', '语文'] },
  { day: 4, courses: ['数学', '语文', '体育', '音乐', '京剧', '跳绳'] },
  { day: 5, courses: ['数学', '语文', '体育', '英语', '科学'] },
  { day: 6, courses: [] },
  { day: 0, courses: [] },
];

// 默认课外班数据（API 失败时使用）
const defaultCourses = [
  { id: 1, name: '高思数学', day: 1, startTime: '18:00', endTime: '20:30', location: '和盛大厦 6 层 27 教室' },
  { id: 2, name: '厚海英语', day: 3, startTime: '18:20', endTime: '20:20', location: '新中关 7 层 705' },
  { id: 3, name: '优才数学', day: 5, startTime: '17:30', endTime: '20:30', location: '知春大厦 7 层 1 教室' },
  { id: 4, name: '羽毛球', day: 0, startTime: '10:30', endTime: '12:00', location: '体育中心' },
  { id: 5, name: '习墨写字', day: 0, startTime: '17:20', endTime: '18:50', location: '书法教室' },
];

const KidView = ({ darkMode, toggleTheme }) => {
  const todayQuote = getTodayQuote();
  const today = new Date().getDay();
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const [assignments, setAssignments] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [courses, setCourses] = useState(defaultCourses);
  const [upcomingReminders, setUpcomingReminders] = useState([]);

  // 从 API 加载数据
  useEffect(() => {
    fetchCourses();
    fetchAssignments();
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/todos');
      const result = await response.json();
      if (result.success) {
        const today = new Date();
        const fifteenDaysLater = new Date();
        fifteenDaysLater.setDate(today.getDate() + 15);
        
        const reminders = result.data
          .filter(t => t.status === 'pending' && t.dueDate)
          .filter(t => {
            const dueDate = new Date(t.dueDate);
            return dueDate >= today && dueDate <= fifteenDaysLater;
          })
          .map(t => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate,
            category: t.category,
            daysLeft: Math.ceil((new Date(t.dueDate) - today) / (1000 * 60 * 60 * 24))
          }))
          .slice(0, 5);
        
        setUpcomingReminders(reminders);
      }
    } catch (error) {
      console.error('获取提醒失败:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/schedules');
      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        const formatted = result.data.map(s => ({
          id: s.id,
          name: s.title,
          day: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          location: s.location
        }));
        setCourses(formatted);
      }
    } catch (error) {
      console.error('获取课程失败:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/assignments');
      const result = await response.json();
      if (result.success) setAssignments(result.data);
    } catch (error) { 
      console.error('获取作业失败:', error); 
    }
  };

  const toggleAssignment = async (id) => {
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;
    
    const newStatus = assignment.status === 'completed' ? 'active' : 'completed';
    const updatedAssignments = assignments.map(a => 
      a.id === id ? { ...a, status: newStatus } : a
    );
    setAssignments(updatedAssignments);
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (newStatus === 'completed') {
        // 显示完成庆祝
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
        
        // 添加完成通知到localStorage，供后台Header读取
        const notifications = JSON.parse(localStorage.getItem('completionNotifications') || '[]');
        notifications.unshift({
          id: `assignment-${id}`,
          assignmentId: id,
          type: 'assignment_completed',
          title: `✅ 作业完成：${assignment.title}`,
          message: `William 完成了 ${assignment.title}`,
          timestamp: new Date().toISOString(),
          read: false
        });
        // 只保留最近20条
        localStorage.setItem('completionNotifications', JSON.stringify(notifications.slice(0, 20)));
        
        // 触发自定义事件通知Header更新
        window.dispatchEvent(new CustomEvent('notificationUpdate'));
      } else {
        // 取消完成时，删除对应的通知
        const notifications = JSON.parse(localStorage.getItem('completionNotifications') || '[]');
        const filtered = notifications.filter(n => n.assignmentId !== id);
        localStorage.setItem('completionNotifications', JSON.stringify(filtered));
        
        // 触发更新
        window.dispatchEvent(new CustomEvent('notificationUpdate'));
      }
    } catch (error) { 
      console.error('更新作业状态失败:', error);
      setAssignments(assignments);
    }
  };

  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const totalCount = assignments.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const todayExternal = courses.filter(c => c.day === today);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center animate-bounce">
            <div className="text-8xl">🎉</div>
            <div className="text-2xl font-bold text-white bg-gradient-to-r from-green-400 to-emerald-500 px-8 py-4 rounded-2xl mt-4 shadow-2xl">
              太棒了！作业完成！
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 lg:p-10">
        {/* 近期待办提醒 */}
        {upcomingReminders.length > 0 && (
          <div className={`rounded-2xl p-6 shadow-sm border mb-8 ${darkMode ? 'bg-orange-900/30 border-orange-600' : 'bg-orange-50 border-orange-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-orange-300' : 'text-orange-800'}`}>
              ⏰ 近期待办提醒
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {upcomingReminders.map(r => (
                <div key={r.id} className={`p-3 rounded-xl ${darkMode ? 'bg-orange-800/50' : 'bg-white'}`}>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{r.title}</div>
                  <div className={`text-sm mt-1 ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                    {r.daysLeft <= 0 ? '已过期' : r.daysLeft === 1 ? '明天' : `${r.daysLeft}天后`}
                    {r.category && <span className="ml-2 opacity-70">[{r.category}]</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 进度区域 + 每日一句 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className={`lg:col-span-2 rounded-2xl p-8 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="relative w-40 h-40 lg:w-48 lg:h-48 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="45%" stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="10" fill="none" />
                  <circle cx="50%" cy="50%" r="45%" stroke={progress === 100 ? '#10b981' : '#6366f1'} strokeWidth="10" fill="none" strokeDasharray={`${progress * 2.83} 283`} className="transition-all duration-1000" strokeLinecap="round" />
                </svg>
                <div className={`absolute inset-0 flex flex-col items-center justify-center ${darkMode ? 'text-white' : ''}`}>
                  <span className="text-5xl lg:text-6xl font-bold">{progress}%</span>
                  <span className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{completedCount}/{totalCount} 完成</span>
                </div>
              </div>
              <div className="text-center lg:text-left flex-1">
                <h2 className={`text-2xl lg:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>William，加油！</h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-lg`}>完成今天的任务，向着目标前进！</p>
                {progress === 100 && <div className="inline-flex items-center gap-2 text-green-600 font-bold text-xl mt-4"><span>🌟</span> 今天任务全部完成！</div>}
              </div>
            </div>
          </div>

          {/* 每日一句 */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 shadow-lg text-white">
            <div className="flex items-start gap-4">
              <span className="text-5xl">💡</span>
              <div>
                <div className="text-sm opacity-80 mb-2 font-medium">每日一句</div>
                <p className="text-2xl font-bold leading-relaxed mb-3">"{todayQuote.text}"</p>
                <p className="text-lg opacity-90 font-medium">—— {todayQuote.author}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 完整课程表（与学习规划一致 - 学校 + 课外班） */}
        <div className={`rounded-2xl shadow-sm border mb-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-xl font-bold p-6 pb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>📆 课程表（学校 + 课外班）</h3>
          {/* 横向滚动容器 */}
          <div className="overflow-x-auto pb-4">
            <div className="grid grid-cols-7 gap-2 min-w-[700px] px-6 pb-2">
              {displayOrder.map((dayIndex, i) => {
                const daySchool = schoolSchedule.find(s => s.day === dayIndex);
                const dayExternal = courses.filter(c => c.day === dayIndex);
                const isToday = dayIndex === today;
                
                return (
                  <div key={dayIndex} className={`p-2 md:p-3 rounded-xl min-h-[200px] md:min-h-[280px] ${isToday ? 'bg-indigo-600 text-white ring-2 md:ring-4 ring-indigo-300' : (darkMode ? 'bg-gray-700' : 'bg-gray-50')}`}>
                    <div className={`text-xs md:text-sm font-bold mb-2 pb-2 border-b text-center ${isToday ? 'text-white border-white/30' : (darkMode ? 'text-gray-200 border-gray-600' : 'text-gray-700 border-gray-200')}`}>{weekDays[i]}</div>
                    <div className="space-y-1">
                      {/* 学校课程 */}
                      {daySchool?.courses && daySchool.courses.length > 0 && (
                        <div className="mb-1 md:mb-2">
                          <div className={`text-xs font-medium mb-1 ${isToday ? 'text-white/70' : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>🏫</div>
                          {daySchool.courses.map((c, j) => (
                            <div key={j} className={`text-xs p-1 rounded mb-1 truncate ${isToday ? 'bg-white/20 text-white' : (darkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-50 text-blue-700')}`}>
                              {c}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* 课外班 */}
                      {dayExternal.length > 0 && (
                        <div>
                          <div className={`text-xs font-medium mb-1 ${isToday ? 'text-white/70' : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>🎯</div>
                          {dayExternal.map((c, j) => (
                            <div key={j} className={`text-xs p-1 rounded mb-1 ${isToday ? 'bg-white/30 text-white' : (darkMode ? 'bg-indigo-900/50 text-indigo-200' : 'bg-indigo-100 text-indigo-700')}`}>
                              <div className="font-medium truncate">{c.name}</div>
                              <div className="text-xs opacity-75">{c.startTime}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {(!daySchool?.courses || daySchool.courses.length === 0) && dayExternal.length === 0 && (
                        <div className={`text-xs text-center py-4 md:py-8 ${isToday ? 'text-white/50' : (darkMode ? 'text-gray-500' : 'text-gray-300')}`}>无课</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* 移动端滚动提示 */}
          <div className={`md:hidden text-center py-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            ← 左右滑动查看完整课程表 →
          </div>
        </div>

        {/* 课外班 + 今日作业（1:3） */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* 课外班（1 份） */}
          <div className={`rounded-2xl p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>🎯 今日课外班</h3>
            <div className="space-y-3">
              {todayExternal.length > 0 ? todayExternal.map(c => (
                <div key={c.id} className={`p-4 rounded-xl border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-indigo-50 border-indigo-200'}`}>
                  <div className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{c.name}</div>
                  <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>🕐 {c.startTime}{c.endTime ? `-${c.endTime}` : ''}</div>
                  {c.location && <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>📍 {c.location}</div>}
                </div>
              )) : (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                  <div className="text-5xl mb-3">🏖️</div>
                  <p>今天没有课外班</p>
                </div>
              )}
            </div>
          </div>

          {/* 今日作业（3 份） */}
          <div className={`lg:col-span-3 rounded-2xl p-4 md:p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-lg md:text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>📋 今日作业</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignments.length > 0 ? assignments.map(a => (
                <div 
                  key={a.id} 
                  onClick={() => toggleAssignment(a.id)} 
                  className={`p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-95 ${a.status === 'completed' ? (darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-green-50/50 border-green-200') : (darkMode ? 'bg-gray-800 border-gray-600 hover:border-indigo-400' : 'bg-white border-gray-200 hover:border-indigo-300')}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${a.status === 'completed' ? 'bg-green-500 text-white' : (darkMode ? 'border-2 border-gray-500' : 'border-2 border-gray-300')}`}>
                      {a.status === 'completed' && <span className="text-xl md:text-lg">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${a.status === 'completed' ? 'line-through opacity-60' : ''} ${darkMode ? (a.status === 'completed' ? 'text-gray-400' : 'text-white') : (a.status === 'completed' ? 'text-gray-500' : 'text-gray-900')}`}>{a.title}</div>
                      {a.subject && (
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{a.subject}</div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className={`col-span-full text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                  <div className="text-6xl mb-4">🌟</div>
                  <p>今天没有作业，好好休息！</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidView;