import React, { useState, useEffect } from 'react';

const Todos = ({ darkMode = false }) => {
  const [todos, setTodos] = useState([]);
  const [starBalance, setStarBalance] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editingTodo, setEditingTodo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    dueTime: '',
    category: '学习',
    priority: '中',
    description: '',
    reminderMinutes: 60,
    points: 2,
    showOnKidBoard: false
  });

  const categoryOptions = { '比赛': '🏆 比赛', '考试': '📝 考试', '学习': '📚 学习', '家务': '🧹 家务', '生活': '🏠 生活', '其他': '📌 其他' };
  const priorityOptions = { '高': '🔴 高', '中': '🟡 中', '低': '🟢 低' };

  // 默认星星数
  const defaultPoints = {
    '比赛': 20, '考试': 20, '学习': 5, '家务': 5, '生活': 2, '其他': 2
  };

  useEffect(() => {
    fetchTodos();
    fetchStarBalance();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      const result = await response.json();
      if (result.success) {
        setTodos(result.data);
      }
    } catch (error) {
      console.error('获取待办失败:', error);
    }
  };

  const fetchStarBalance = async () => {
    try {
      const response = await fetch('/api/stars/balance');
      const result = await response.json();
      if (result.success) {
        setStarBalance(result.data.balance);
      }
    } catch (error) {
      console.error('获取星星余额失败:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      dueDate: '',
      dueTime: '',
      category: '学习',
      priority: '中',
      description: '',
      reminderMinutes: 60,
      points: 5,
      showOnKidBoard: false
    });
    setEditingTodo(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingTodo ? `/api/todos/${editingTodo.id}` : '/api/todos';
      const method = editingTodo ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        resetForm();
        fetchTodos();
      } else {
        alert(result.message || '操作失败');
      }
    } catch (error) {
      alert('操作失败，请重试');
    }
  };

  const startEdit = (todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      dueDate: todo.dueDate || '',
      dueTime: todo.dueTime || '',
      category: todo.category || '学习',
      priority: todo.priority || '中',
      description: todo.description || '',
      reminderMinutes: todo.reminderMinutes || 60,
      points: todo.points || 5,
      showOnKidBoard: todo.showOnKidBoard || false
    });
    setShowForm(true);
  };

  const toggleStatus = async (todo) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    try {
      const token = localStorage.getItem('token');
      
      // 更新待办状态
      await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      
      // 如果完成，增加星星
      if (newStatus === 'completed' && todo.points) {
        await fetch('/api/stars/adjust', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            amount: todo.points, 
            description: `完成待办：${todo.title}` 
          })
        });
        fetchStarBalance();
      }
      
      fetchTodos();
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除这个待办事项吗？')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      resetForm();
      fetchTodos();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return '已过期';
    if (diffDays === 1) return '明天';
    if (diffDays <= 7) return `${diffDays}天后`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const filteredTodos = filter === 'all' ? todos :
    filter === 'pending' ? todos.filter(t => t.status === 'pending') :
    filter === 'completed' ? todos.filter(t => t.status === 'completed') :
    todos.filter(t => t.category === filter);

  const pendingCount = todos.filter(t => t.status === 'pending').length;
  const completedCount = todos.filter(t => t.status === 'completed').length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* 头部 */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>📋 近期待办</h2>
          <div className="text-amber-500 text-sm mt-1">当前星星: {starBalance} ⭐</div>
        </div>
        <button onClick={() => { setShowForm(true); setEditingTodo(null); setFormData(f => ({...f, points: 5})); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm md:text-base">+ 添加待办</button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className={`rounded-xl p-4 md:p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <p className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{todos.length}</p>
          <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>全部待办</p>
        </div>
        <div className={`rounded-xl p-4 md:p-5 ${darkMode ? 'bg-orange-900/50' : 'bg-orange-50'}`}>
          <p className="text-2xl md:text-3xl font-bold text-orange-600">{pendingCount}</p>
          <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>待完成</p>
        </div>
        <div className={`rounded-xl p-4 md:p-5 ${darkMode ? 'bg-green-900/50' : 'bg-green-50'}`}>
          <p className="text-2xl md:text-3xl font-bold text-green-600">{completedCount}</p>
          <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>已完成</p>
        </div>
      </div>

      {/* 添加/编辑表单 */}
      {showForm && (
        <div className={`rounded-2xl p-4 md:p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-base md:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {editingTodo ? '编辑待办' : '添加新待办'}
            </h3>
            {editingTodo && (
              <button onClick={() => handleDelete(editingTodo.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">🗑️</button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <input type="text" placeholder="待办事项" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`px-3 md:px-4 py-2 border rounded-lg text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} required />
              <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className={`px-3 md:px-4 py-2 border rounded-lg text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
              <input type="time" value={formData.dueTime} onChange={e => setFormData({...formData, dueTime: e.target.value})} className={`px-3 md:px-4 py-2 border rounded-lg text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value, points: defaultPoints[e.target.value] || 2})} className={`px-3 md:px-4 py-2 border rounded-lg text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
                {Object.entries(categoryOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className={`px-3 md:px-4 py-2 border rounded-lg text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
                {Object.entries(priorityOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={formData.reminderMinutes} onChange={e => setFormData({...formData, reminderMinutes: parseInt(e.target.value)})} className={`px-3 md:px-4 py-2 border rounded-lg text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
                <option value={0}>不提醒</option>
                <option value={30}>提前30分钟</option>
                <option value={60}>提前1小时</option>
                <option value={1440}>提前1天</option>
              </select>
            </div>
            
            {/* 星星设置 */}
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-amber-50'} border ${darkMode ? 'border-gray-600' : 'border-amber-200'}`}>
              <label className="flex items-center gap-2 mb-2">
                <span className="text-xl">⭐</span>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>完成奖励星星</span>
              </label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setFormData({...formData, points: Math.max(0, formData.points - 1)})} className="w-10 h-10 rounded-full bg-red-500 text-white font-bold text-xl hover:bg-red-600 transition">-</button>
                <input type="number" value={formData.points} onChange={e => setFormData({...formData, points: Math.max(0, parseInt(e.target.value) || 0)})} className="w-20 px-3 py-2 text-center text-xl font-bold border rounded-lg" />
                <button type="button" onClick={() => setFormData({...formData, points: formData.points + 1})} className="w-10 h-10 rounded-full bg-green-500 text-white font-bold text-xl hover:bg-green-600 transition">+</button>
                <div className="text-xs text-purple-500 ml-2">建议: {defaultPoints[formData.category] || 2}⭐</div>
                {formData.points === 0 && <span className="text-xs text-gray-500 ml-1">(无星星奖励，家长代办任务)</span>}
              </div>
              
              {/* 展示给孩子选项 */}
              <label className="flex items-center gap-2 mt-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.showOnKidBoard} 
                  onChange={e => setFormData({...formData, showOnKidBoard: e.target.checked})} 
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>👶 在孩子看板展示</span>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(默认不展示，勾选后孩子可以看到)</span>
              </label>
            </div>
            
            <textarea placeholder="备注说明" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`w-full px-3 md:px-4 py-2 border rounded-lg text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} rows={2} />
            
            <div className="flex gap-2">
              <button type="submit" className="flex-1 md:flex-none px-4 md:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm md:text-base font-medium">{editingTodo ? '更新' : '添加'}</button>
              <button type="button" onClick={resetForm} className={`px-4 md:px-6 py-2 rounded-lg text-sm md:text-base ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>取消</button>
            </div>
          </form>
        </div>
      )}

      {/* 筛选 */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 md:px-4 py-2 rounded-lg text-sm ${filter === 'all' ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100')}`}>全部</button>
        <button onClick={() => setFilter('pending')} className={`px-3 md:px-4 py-2 rounded-lg text-sm ${filter === 'pending' ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100')}`}>待完成</button>
        <button onClick={() => setFilter('completed')} className={`px-3 md:px-4 py-2 rounded-lg text-sm ${filter === 'completed' ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100')}`}>已完成</button>
        <span className={`hidden md:block mx-2 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`}>|</span>
        {Object.keys(categoryOptions).map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-3 md:px-4 py-2 rounded-lg text-sm ${filter === cat ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100')}`}>{categoryOptions[cat]}</button>
        ))}
      </div>

      {/* 待办列表 */}
      <div className="space-y-3">
        {filteredTodos.length > 0 ? filteredTodos.map(todo => (
          <div key={todo.id} className={`rounded-xl p-3 md:p-4 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} ${todo.status === 'completed' ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3 md:gap-4">
              <button
                onClick={(e) => { e.stopPropagation(); toggleStatus(todo); }}
                className={`w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform ${todo.status === 'completed' ? 'bg-green-500 text-white' : (darkMode ? 'border-2 border-gray-500' : 'border-2 border-gray-300')}`}
              >
                {todo.status === 'completed' && <span className="text-xl md:text-base">✓</span>}
              </button>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => startEdit(todo)}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-bold ${todo.status === 'completed' ? 'line-through' : ''} ${darkMode ? 'text-white' : 'text-gray-900'}`}>{todo.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${todo.priority === '高' ? 'bg-red-100 text-red-700' : todo.priority === '低' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{todo.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{todo.category}</span>
                  {/* 星星数量 */}
                  {todo.points && (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">⭐ {todo.points}</span>
                  )}
                </div>
                <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  📅 {formatDate(todo.dueDate)} {todo.dueTime && `· ${todo.dueTime}`}
                </div>
                {todo.description && (
                  <div className={`text-sm mt-1 truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{todo.description}</div>
                )}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); startEdit(todo); }} 
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium active:bg-indigo-200 md:bg-transparent md:text-gray-500 md:font-normal md:hover:text-gray-700"
              >
                编辑
              </button>
            </div>
          </div>
        )) : (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-5xl mb-4">📝</div>
            <p>暂无待办事项</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Todos;