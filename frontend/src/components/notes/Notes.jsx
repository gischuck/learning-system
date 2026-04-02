import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const Notes = ({ darkMode = false }) => {
  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [filter, setFilter] = useState('all');
  const [plans, setPlans] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '育儿',
    tags: '',
    relatedPlanId: ''
  });

  const categoryOptions = {
    '育儿': '👶 育儿经验',
    '学习规划': '📚 学习规划',
    '比赛': '🏆 比赛相关',
    '考试': '📝 考试相关',
    '成长记录': '🌱 成长记录',
    '其他': '📌 其他'
  };

  useEffect(() => {
    fetchNotes();
    fetchPlans();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      const result = await response.json();
      if (result.success) {
        // 排除便签类型的笔记
        const filteredNotes = (result.data || []).filter(n => n.category !== 'sticky');
        setNotes(filteredNotes);
      }
    } catch (error) {
      console.error('获取笔记失败:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      const result = await response.json();
      if (result.success) {
        setPlans(result.data || []);
      }
    } catch (error) {
      console.error('获取规划失败:', error);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', category: '育儿', tags: '', relatedPlanId: '' });
    setEditingNote(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const noteData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      relatedPlanId: formData.relatedPlanId || null
    };

    try {
      const url = editingNote ? `/api/notes/${editingNote.id}` : '/api/notes';
      const method = editingNote ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(noteData)
      });

      const result = await response.json();
      if (result.success) {
        resetForm();
        fetchNotes();
      } else {
        alert(result.message || '操作失败');
      }
    } catch (error) {
      alert('操作失败，请重试');
    }
  };

  const startEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content || '',
      category: note.category || '育儿',
      tags: (note.tags || []).join(', '),
      relatedPlanId: note.relatedPlanId || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotes();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const filteredNotes = filter === 'all' ? notes : notes.filter(n => n.category === filter);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getRelatedPlanTitle = (planId) => {
    if (!planId) return null;
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.title : null;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>📖 育儿笔记</h2>
        <button onClick={() => { setShowForm(true); setEditingNote(null); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm md:text-base">+ 新建笔记</button>
      </div>

      {/* 添加/编辑表单 */}
      {showForm && (
        <div className={`rounded-2xl p-4 md:p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-base md:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{editingNote ? '编辑笔记' : '新建笔记'}</h3>
            {editingNote && (
              <button onClick={() => setShowDeleteConfirm(editingNote.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">🗑️ 删除</button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder="标题" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              className={`w-full px-3 md:px-4 py-2 border rounded-lg text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} 
              required 
            />
            <textarea 
              placeholder="内容..." 
              value={formData.content} 
              onChange={e => setFormData({...formData, content: e.target.value})} 
              className={`w-full px-3 md:px-4 py-2 border rounded-lg h-40 md:h-48 text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} 
              required 
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})} 
                className={`px-3 md:px-4 py-2 border rounded-lg text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
              >
                {Object.entries(categoryOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input 
                type="text" 
                placeholder="标签（逗号分隔）" 
                value={formData.tags} 
                onChange={e => setFormData({...formData, tags: e.target.value})} 
                className={`px-3 md:px-4 py-2 border rounded-lg text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} 
              />
              <select 
                value={formData.relatedPlanId} 
                onChange={e => setFormData({...formData, relatedPlanId: e.target.value})} 
                className={`px-3 md:px-4 py-2 border rounded-lg text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
              >
                <option value="">关联学习规划（可选）</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 md:flex-none px-4 md:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm md:text-base">{editingNote ? '更新' : '保存'}</button>
              <button type="button" onClick={resetForm} className={`px-4 md:px-6 py-2 rounded-lg text-sm md:text-base ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>取消</button>
            </div>
          </form>
        </div>
      )}

      {/* 分类筛选 */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 md:px-4 py-2 rounded-lg text-sm ${filter === 'all' ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100')}`}>全部</button>
        {Object.entries(categoryOptions).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 md:px-4 py-2 rounded-lg text-sm ${filter === k ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100')}`}>{v}</button>
        ))}
      </div>

      {/* 笔记列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.length > 0 ? filteredNotes.map(note => (
          <div 
            key={note.id} 
            onClick={() => startEdit(note)}
            className={`rounded-xl p-4 md:p-5 cursor-pointer transition-all border ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-indigo-500' : 'bg-white hover:shadow-md border-gray-100'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className={`font-bold text-sm md:text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{note.title}</h3>
              <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {categoryOptions[note.category] || note.category}
              </span>
            </div>
            <p className={`text-sm line-clamp-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{note.content}</p>
            
            {/* 关联的学习规划 */}
            {note.relatedPlanId && (
              <div className={`mt-3 pt-2 border-t text-xs ${darkMode ? 'border-gray-700 text-indigo-400' : 'border-gray-100 text-indigo-600'}`}>
                📚 关联规划：{getRelatedPlanTitle(note.relatedPlanId)}
              </div>
            )}
            
            {/* 标签 */}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {note.tags.map((tag, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>#{tag}</span>
                ))}
              </div>
            )}
            
            <div className={`text-xs mt-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {formatDate(note.createdAt)}
              {note.viewCount > 0 && <span className="ml-2">👁 {note.viewCount}</span>}
            </div>
          </div>
        )) : (
          <div className={`col-span-full text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-5xl mb-4">📝</div>
            <p>暂无笔记</p>
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      <Modal
        isOpen={showDeleteConfirm !== null}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => { handleDelete(showDeleteConfirm); setShowDeleteConfirm(null); }}
        title="确认删除"
        message="确定要删除这个笔记吗？此操作不可恢复。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />
    </div>
  );
};

export default Notes;