import React, { useState, useEffect } from 'react';

const Dashboard = ({ darkMode = false }) => {
  const [stats, setStats] = useState({
    stickyNotes: 0,
    pending: 0,
    completed: 0,
    events: 0,
    notes: 0,
    assignments: { total: 0, active: 0, completed: 0 }
  });
  const [upcomingTodos, setUpcomingTodos] = useState([]);
  const [importantEvents, setImportantEvents] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [stickyRes, todosRes, notesRes, assignmentsRes, plansRes] = await Promise.all([
        fetch('/api/notes/sticky'),
        fetch('/api/todos'),
        fetch('/api/notes'),
        fetch('/api/assignments'),
        fetch('/api/plans')
      ]);

      const stickyData = await stickyRes.json();
      const todosData = await todosRes.json();
      const notesData = await notesRes.json();
      const assignmentsData = await assignmentsRes.json();
      const plansData = await plansRes.json();

      const stickyNotes = stickyData.success ? stickyData.data : [];
      const todos = todosData.success ? todosData.data : [];
      const notes = notesData.success ? notesData.data : [];
      const assignments = assignmentsData.success ? assignmentsData.data : [];

      const pending = todos.filter(t => t.status === 'pending').length;
      const completed = todos.filter(t => t.status === 'completed').length;
      const activeAssignments = assignments.filter(a => a.status === 'active').length;

      const today = new Date().toISOString().split('T')[0];
      const sortedTodos = todos
        .filter(t => t.status === 'pending' && t.dueDate >= today)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 6);

      const events = todos
        .filter(t => (t.category === '比赛' || t.category === '考试') && t.status === 'pending')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);

      setStats({
        stickyNotes: stickyNotes.length,
        pending,
        completed,
        events: events.length,
        notes: notes.filter(n => n.category !== 'sticky').length,
        assignments: {
          total: assignments.length,
          active: activeAssignments,
          completed: assignments.filter(a => a.status === 'completed').length
        }
      });
      setUpcomingTodos(sortedTodos);
      setImportantEvents(events);
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  const toggleTodo = async (id) => {
    try {
      const todo = upcomingTodos.find(t => t.id === id);
      if (!todo) return;
      
      const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
      
      // 更新本地状态
      const updatedTodos = upcomingTodos.map(t => 
        t.id === id ? { ...t, status: newStatus } : t
      );
      setUpcomingTodos(updatedTodos);
      
      // 更新统计
      setStats(prev => ({
        ...prev,
        pending: newStatus === 'completed' ? prev.pending - 1 : prev.pending + 1,
        completed: newStatus === 'completed' ? prev.completed + 1 : prev.completed - 1
      }));
      
      // 保存到后端
      const token = localStorage.getItem('token');
      await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      
      // 重新获取数据确保同步
      setTimeout(fetchDashboardData, 1000);
    } catch (error) {
      console.error('更新待办失败:', error);
      fetchDashboardData();
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return '已过期';
    if (diffDays === 1) return '明天';
    if (diffDays <= 7) return `${diffDays}天后`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon="📌" title="规划便签" value={stats.stickyNotes || 0} subtitle="个" darkMode={darkMode} />
        <StatCard icon="⏳" title="待办事项" value={stats.pending || 0} subtitle="待完成" darkMode={darkMode} />
        <StatCard icon="✅" title="已完成" value={stats.completed || 0} subtitle="个" darkMode={darkMode} />
        <StatCard icon="🏆" title="近期重要节点" value={stats.events || 0} subtitle="个" darkMode={darkMode} />
        <StatCard icon="📝" title="育儿笔记" value={stats.notes || 0} subtitle="篇" darkMode={darkMode} />
        <StatCard icon="📋" title="作业" value={stats.assignments?.active || 0} subtitle="待完成" darkMode={darkMode} />
      </div>

      {/* 两栏布局 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 近期待办 */}
        <div className={`rounded-2xl p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <span className="text-xl">🔥</span> 近期待办
            </h3>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>按截止日期排序</span>
          </div>
          <div className="space-y-2">
            {upcomingTodos.length === 0 ? (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>暂无待办事项</p>
            ) : (
              upcomingTodos.map(todo => (
                <div key={todo.id} className={`flex items-center gap-4 p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <input 
                    type="checkbox" 
                    className={`w-5 h-5 rounded-lg cursor-pointer ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`} 
                    checked={todo.status === 'completed'}
                    onChange={() => toggleTodo(todo.id)}
                  />
                  <span className={`flex-1 ${todo.status === 'completed' ? 'line-through text-gray-400' : (todo.priority === 'high' ? 'text-red-400 font-medium' : (darkMode ? 'text-gray-200' : 'text-gray-700'))}`}>{todo.title}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-lg ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>{todo.category}</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(todo.dueDate)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 近期重要节点 */}
        <div className={`rounded-2xl p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <span className="text-xl">🏆</span> 近期重要节点
            </h3>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>比赛·考试</span>
          </div>
          <div className="space-y-2">
            {importantEvents.length === 0 ? (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>暂无重要节点</p>
            ) : (
              importantEvents.map((event, idx) => (
                <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                    <span className="text-xl font-bold text-indigo-600">{new Date(event.dueDate).getDate()}</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(event.dueDate).getMonth() + 1}月</span>
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{event.title}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>截止：{event.dueDate}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${event.category === '比赛' ? (darkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700') : (darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700')}`}>
                    {event.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle, darkMode = false }) => (
  <div className={`rounded-2xl border shadow-sm p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        <p className={`text-base mt-1 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{title}</p>
        <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
      </div>
      <div className="text-4xl">{icon}</div>
    </div>
  </div>
);

export default Dashboard;