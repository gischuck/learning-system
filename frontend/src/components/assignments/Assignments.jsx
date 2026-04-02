import React, { useState, useEffect } from 'react';

const Assignments = ({ darkMode = false }) => {
  const [assignments, setAssignments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, cancelled: 0 });
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  // 星星规则设置
  const [starSettings, setStarSettings] = useState(() => {
    const saved = localStorage.getItem('william_star_settings');
    return saved ? JSON.parse(saved) : {
      extraHW: 5,      // 课外班作业
      schoolHW: 3,     // 学校作业
      competition: 20, // 竞赛
      daily: 2         // 日常任务
    };
  });
  const [editingSettings, setEditingSettings] = useState(false);

  // 根据科目自动推荐星星数
  const getRecommendedStars = (subject, title) => {
    // 课外班作业
    if (['高思数学', '厚海英语', '优才数学', '习墨写字', 'C++'].some(s => title.includes(s))) {
      return starSettings.extraHW;
    }
    // 竞赛准备
    if (['PET', 'GESP', '竞赛', '考试', '备考'].some(s => title.includes(s))) {
      return starSettings.competition;
    }
    // 学校作业
    if (['数学', '语文', '英语'].includes(subject)) {
      return starSettings.schoolHW;
    }
    return starSettings.daily;
  };

  const assignedByOptions = ['爸爸', '妈妈', '管理员'];
  
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'homework', subject: '数学', taskType: 'once', recurringType: 'daily', recurringDays: [], fixedDate: '', dueTime: '', assignedByName: '爸爸', status: 'active', points: 5
  });

  const subjectOptions = { '数学': '数学', '语文': '语文', '英语': '英语', '科学': '科学', '体育': '体育', '艺术': '艺术', '其他': '其他' };
  const typeOptions = { homework: '作业', practice: '练习', reading: '阅读', sports: '运动', art: '艺术', other: '其他' };
  const statusOptions = { active: '进行中', completed: '已完成', cancelled: '已取消' };

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/assignments');
      const result = await response.json();
      if (result.success) {
        setAssignments(result.data);
        setStats({
          total: result.data.length,
          active: result.data.filter(a => a.status === 'active').length,
          completed: result.data.filter(a => a.status === 'completed').length,
          cancelled: result.data.filter(a => a.status === 'cancelled').length
        });
      }
    } catch (error) {
      console.error('获取作业失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  // 当标题或科目变化时，自动计算推荐星星
  useEffect(() => {
    if (formData.title && !editingAssignment) {
      const recommended = getRecommendedStars(formData.subject, formData.title);
      setFormData(prev => ({ ...prev, points: recommended }));
    }
  }, [formData.title, formData.subject]);

  const resetForm = () => {
    setFormData({ title: '', description: '', type: 'homework', subject: '数学', taskType: 'once', recurringType: 'daily', recurringDays: [], fixedDate: '', dueTime: '', assignedByName: '爸爸', status: 'active', points: 5 });
    setEditingAssignment(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingAssignment ? `/api/assignments/${editingAssignment.id}` : '/api/assignments';
      const method = editingAssignment ? 'PUT' : 'POST';
      
      const bodyData = {
        ...formData,
        points: parseInt(formData.points) || 5,
        assignedBy: editingAssignment ? editingAssignment.assignedBy : undefined,
        status: editingAssignment ? formData.status : 'active'
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(bodyData)
      });
      const result = await response.json();
      if (result.success) {
        alert(editingAssignment ? '作业更新成功' : '作业布置成功');
        resetForm();
        fetchAssignments();
      } else {
        alert(result.message || '操作失败');
      }
    } catch (error) {
      alert('操作失败，请重试');
    }
  };

  const startEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      type: assignment.type,
      subject: assignment.subject,
      taskType: assignment.taskType,
      recurringType: assignment.recurringType || 'daily',
      recurringDays: assignment.recurringDays || [],
      fixedDate: assignment.fixedDate || '',
      dueTime: assignment.dueTime || '',
      assignedByName: assignment.assignedByName || '爸爸',
      status: assignment.status || 'active',
      points: assignment.points || 5
    });
    setShowForm(true);
  };

  const handleCancel = async (id) => {
    if (!confirm('确定要取消这个作业吗？')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/assignments/${id}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) fetchAssignments();
    } catch (error) {
      console.error('取消失败:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个作业吗？')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) fetchAssignments();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const filteredAssignments = filter === 'all' ? assignments :
    filter === 'active' ? assignments.filter(a => a.status === 'active') :
    filter === 'completed' ? assignments.filter(a => a.status === 'completed') : assignments;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>📝 作业/任务布置</h2>
        <button onClick={() => { setShowForm(true); setEditingAssignment(null); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ 布置作业</button>
      </div>

      {/* 星星规则提示 - 可编辑 */}
      <div className={`rounded-xl p-4 ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'} border ${darkMode ? 'border-amber-700' : 'border-amber-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-xl">⭐</span>
            <span className={`font-bold ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>星星奖励规则</span>
          </div>
          <button 
            onClick={() => setEditingSettings(!editingSettings)} 
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              editingSettings 
                ? 'bg-indigo-500 text-white' 
                : darkMode 
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                  : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {editingSettings ? '完成' : '编辑'}
          </button>
        </div>
        
        {editingSettings ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-amber-800/30' : 'bg-white'}`}>
              <label className={`text-xs ${darkMode ? 'text-amber-300' : 'text-amber-600'}`}>课外班作业</label>
              <input 
                type="number" 
                min="1" 
                max="100"
                value={starSettings.extraHW} 
                onChange={e => {
                  const newSettings = { ...starSettings, extraHW: parseInt(e.target.value) || 5 };
                  setStarSettings(newSettings);
                  localStorage.setItem('william_star_settings', JSON.stringify(newSettings));
                }}
                className={`w-full mt-1 px-3 py-2 border rounded-lg text-center font-bold text-lg ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-amber-300' : 'border-amber-200 text-amber-700'
                }`}
              />
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-800/30' : 'bg-white'}`}>
              <label className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>学校作业</label>
              <input 
                type="number" 
                min="1" 
                max="100"
                value={starSettings.schoolHW} 
                onChange={e => {
                  const newSettings = { ...starSettings, schoolHW: parseInt(e.target.value) || 3 };
                  setStarSettings(newSettings);
                  localStorage.setItem('william_star_settings', JSON.stringify(newSettings));
                }}
                className={`w-full mt-1 px-3 py-2 border rounded-lg text-center font-bold text-lg ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-blue-300' : 'border-blue-200 text-blue-700'
                }`}
              />
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-pink-800/30' : 'bg-white'}`}>
              <label className={`text-xs ${darkMode ? 'text-pink-300' : 'text-pink-600'}`}>竞赛准备</label>
              <input 
                type="number" 
                min="1" 
                max="100"
                value={starSettings.competition} 
                onChange={e => {
                  const newSettings = { ...starSettings, competition: parseInt(e.target.value) || 20 };
                  setStarSettings(newSettings);
                  localStorage.setItem('william_star_settings', JSON.stringify(newSettings));
                }}
                className={`w-full mt-1 px-3 py-2 border rounded-lg text-center font-bold text-lg ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-pink-300' : 'border-pink-200 text-pink-700'
                }`}
              />
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-white'}`}>
              <label className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>日常任务</label>
              <input 
                type="number" 
                min="1" 
                max="100"
                value={starSettings.daily} 
                onChange={e => {
                  const newSettings = { ...starSettings, daily: parseInt(e.target.value) || 2 };
                  setStarSettings(newSettings);
                  localStorage.setItem('william_star_settings', JSON.stringify(newSettings));
                }}
                className={`w-full mt-1 px-3 py-2 border rounded-lg text-center font-bold text-lg ${
                  darkMode ? 'bg-slate-600 border-slate-500 text-slate-300' : 'border-slate-200 text-slate-600'
                }`}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 text-sm">
            <span className={`px-3 py-1 rounded-lg ${darkMode ? 'bg-amber-800/50 text-amber-200' : 'bg-white text-amber-700'}`}>
              课外班作业: {starSettings.extraHW}⭐
            </span>
            <span className={`px-3 py-1 rounded-lg ${darkMode ? 'bg-blue-800/50 text-blue-200' : 'bg-white text-blue-700'}`}>
              学校作业: {starSettings.schoolHW}⭐
            </span>
            <span className={`px-3 py-1 rounded-lg ${darkMode ? 'bg-pink-800/50 text-pink-200' : 'bg-white text-pink-700'}`}>
              竞赛准备: {starSettings.competition}⭐
            </span>
            <span className={`px-3 py-1 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'}`}>
              日常任务: {starSettings.daily}⭐
            </span>
          </div>
        )}
        <p className={`text-xs mt-2 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
          💡 系统会根据作业标题自动推荐星星数，你也可以手动调整
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="总作业数" value={stats.total} colorType="indigo" darkMode={darkMode} />
        <StatCard title="进行中" value={stats.active} colorType="blue" darkMode={darkMode} />
        <StatCard title="已完成" value={stats.completed} colorType="green" darkMode={darkMode} />
        <StatCard title="已取消" value={stats.cancelled} colorType="gray" darkMode={darkMode} />
      </div>

      {/* 布置表单 */}
      {showForm && (
        <div className={`rounded-2xl p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{editingAssignment ? '编辑作业' : '布置新作业'}</h3>
            {editingAssignment && (
              <div className="flex gap-2">
                {editingAssignment.status !== 'cancelled' && (
                  <button onClick={() => { handleCancel(editingAssignment.id); resetForm(); }} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">
                    取消作业
                  </button>
                )}
                <button onClick={() => { handleDelete(editingAssignment.id); resetForm(); }} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                  🗑️ 删除
                </button>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <input type="text" placeholder="作业标题" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} required />
              <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
                {Object.entries(subjectOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
                {Object.entries(typeOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={formData.assignedByName} onChange={e => setFormData({...formData, assignedByName: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
                {assignedByOptions.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            {/* 星星设置行 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <label className={`text-sm whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>⭐ 星星奖励:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100"
                  value={formData.points} 
                  onChange={e => setFormData({...formData, points: e.target.value})} 
                  className={`w-20 px-3 py-2 border rounded-lg text-center ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} 
                />
                <span className="text-amber-500">⭐</span>
              </div>
              <select value={formData.taskType} onChange={e => setFormData({...formData, taskType: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
                <option value="once">单次作业</option>
                <option value="recurring">常态化</option>
                <option value="fixed_date">固定日期</option>
              </select>
              {formData.taskType === 'fixed_date' && <input type="date" value={formData.fixedDate} onChange={e => setFormData({...formData, fixedDate: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />}
              {formData.taskType === 'recurring' && <select value={formData.recurringType} onChange={e => setFormData({...formData, recurringType: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}><option value="daily">每天</option><option value="weekly">每周</option><option value="monthly">每月</option></select>}
              <input type="time" value={formData.dueTime} onChange={e => setFormData({...formData, dueTime: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
              {editingAssignment && (
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
                  {Object.entries(statusOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              )}
            </div>

            <textarea placeholder="作业内容描述" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} rows={3} />
            
            <div className="flex gap-2">
              <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{editingAssignment ? '更新' : '确认布置'}</button>
              <button type="button" onClick={resetForm} className={`px-6 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>取消</button>
            </div>
          </form>
        </div>
      )}

      {/* 筛选 */}
      <div className="flex gap-2">
        {['all', 'active', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg ${filter === f ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100')}`}>
            {f === 'all' ? '全部' : f === 'active' ? '进行中' : '已完成'}
          </button>
        ))}
      </div>

      {/* 作业列表 */}
      <div className="space-y-3">
        {loading ? (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>加载中...</div>
        ) : filteredAssignments.length > 0 ? filteredAssignments.map(a => (
          <div key={a.id} className={`rounded-xl p-4 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} ${a.status === 'completed' ? 'opacity-70 ' + (darkMode ? 'bg-green-900/20' : 'bg-green-50') : ''} ${a.status === 'cancelled' ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-lg font-bold ${a.status === 'completed' ? 'line-through' : ''} ${darkMode ? 'text-white' : 'text-gray-900'}`}>{a.title}</span>
                  <span className={`text-xs px-2 py-1 rounded ${a.status === 'active' ? (darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700') : a.status === 'completed' ? (darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700') : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}>
                    {a.status === 'active' ? '进行中' : a.status === 'completed' ? '✓ 已完成' : '已取消'}
                  </span>
                  {/* 星星标签 */}
                  <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                    ⭐ {a.points || 5} 星星
                  </span>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{a.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                  <span>📚 {a.subject}</span>
                  <span>📝 {typeOptions[a.type]}</span>
                  <span>👤 {a.assignedByName || '管理员'}</span>
                  <span>🕐 {new Date(a.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(a)} className="text-blue-600 hover:text-blue-800 text-sm">编辑</button>
                {a.status === 'active' && <button onClick={() => handleCancel(a.id)} className="text-orange-600 hover:text-orange-800 text-sm">取消</button>}
                <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:text-red-800 text-sm">删除</button>
              </div>
            </div>
          </div>
        )) : (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>暂无作业</div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, colorType, darkMode = false }) => {
  const colorMap = {
    indigo: darkMode ? 'bg-indigo-900/50' : 'bg-indigo-50',
    blue: darkMode ? 'bg-blue-900/50' : 'bg-blue-50',
    green: darkMode ? 'bg-green-900/50' : 'bg-green-50',
    gray: darkMode ? 'bg-gray-700' : 'bg-gray-50',
  };
  const textColorMap = {
    indigo: darkMode ? 'text-indigo-300' : 'text-indigo-700',
    blue: darkMode ? 'text-blue-300' : 'text-blue-700',
    green: darkMode ? 'text-green-300' : 'text-green-700',
    gray: darkMode ? 'text-gray-300' : 'text-gray-700',
  };
  
  return (
    <div className={`rounded-xl p-5 ${colorMap[colorType]}`}>
      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-sm ${textColorMap[colorType]}`}>{title}</p>
    </div>
  );
};

export default Assignments;