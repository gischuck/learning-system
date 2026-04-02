import React, { useState, useEffect } from 'react';

const COLORS = [
  { id: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', darkBg: 'bg-yellow-900/50', darkBorder: 'border-yellow-600', darkText: 'text-yellow-200' },
  { id: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', darkBg: 'bg-pink-900/50', darkBorder: 'border-pink-600', darkText: 'text-pink-200' },
  { id: 'blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', darkBg: 'bg-blue-900/50', darkBorder: 'border-blue-600', darkText: 'text-blue-200' },
  { id: 'green', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', darkBg: 'bg-green-900/50', darkBorder: 'border-green-600', darkText: 'text-green-200' },
  { id: 'purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', darkBg: 'bg-purple-900/50', darkBorder: 'border-purple-600', darkText: 'text-purple-200' },
];

const StickyNotes = ({ darkMode = false }) => {
  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', color: 'yellow' });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes/sticky');
      const result = await response.json();
      if (result.success) {
        setNotes(result.data || []);
      }
    } catch (error) {
      // 如果 API 不存在，使用本地存储
      const saved = localStorage.getItem('stickyNotes');
      if (saved) {
        setNotes(JSON.parse(saved));
      }
    }
  };

  const saveNotes = async (newNotes) => {
    setNotes(newNotes);
    localStorage.setItem('stickyNotes', JSON.stringify(newNotes));
    
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notes/sticky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notes: newNotes })
      });
    } catch (error) {
      // 静默失败，本地存储已保存
    }
  };

  const addNote = () => {
    if (!formData.title.trim() && !formData.content.trim()) return;
    
    const newNote = {
      id: Date.now(),
      title: formData.title,
      content: formData.content,
      color: formData.color,
      createdAt: new Date().toISOString(),
    };
    
    saveNotes([newNote, ...notes]);
    resetForm();
  };

  const updateNote = () => {
    if (!editingNote) return;
    
    const updated = notes.map(n => 
      n.id === editingNote.id 
        ? { ...n, title: formData.title, content: formData.content, color: formData.color, updatedAt: new Date().toISOString() }
        : n
    );
    saveNotes(updated);
    resetForm();
  };

  const deleteNote = (id) => {
    if (!confirm('确定删除这个便签吗？')) return;
    saveNotes(notes.filter(n => n.id !== id));
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', color: 'yellow' });
    setEditingNote(null);
    setShowForm(false);
  };

  const startEdit = (note) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content, color: note.color });
    setShowForm(true);
  };

  const getColorClass = (note) => {
    const color = COLORS.find(c => c.id === note.color) || COLORS[0];
    return darkMode 
      ? `${color.darkBg} ${color.darkBorder} ${color.darkText}`
      : `${color.bg} ${color.border} ${color.text}`;
  };

  return (
    <div className={`rounded-2xl p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          📌 临时便签
          <span className={`ml-2 text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            ({notes.length} 个)
          </span>
        </h3>
        <button 
          onClick={() => { setShowForm(true); setEditingNote(null); }}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          + 新便签
        </button>
      </div>

      {/* 添加/编辑表单 */}
      {showForm && (
        <div className={`mb-4 p-4 rounded-xl border-2 border-dashed ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
          <input
            type="text"
            placeholder="标题（可选）"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg mb-2 ${darkMode ? 'bg-gray-600 text-white' : 'bg-white'}`}
          />
          <textarea
            placeholder="记录灵感、想法、临时安排..."
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg h-20 ${darkMode ? 'bg-gray-600 text-white' : 'bg-white'}`}
          />
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>颜色：</span>
            {COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setFormData({ ...formData, color: c.id })}
                className={`w-6 h-6 rounded-full ${c.bg} border-2 ${formData.color === c.id ? 'ring-2 ring-indigo-500' : ''}`}
              />
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={editingNote ? updateNote : addNote} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              {editingNote ? '更新' : '保存'}
            </button>
            <button onClick={resetForm} className={`px-4 py-2 rounded-lg text-sm ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              取消
            </button>
          </div>
        </div>
      )}

      {/* 便签列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {notes.length === 0 ? (
          <div className={`col-span-full text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-4xl mb-2">📝</div>
            <p>暂无便签，点击"新便签"开始记录</p>
          </div>
        ) : (
          notes.map(note => (
            <div 
              key={note.id} 
              className={`p-4 rounded-xl border-2 ${getColorClass(note)} transform hover:scale-105 transition-transform cursor-pointer`}
              onClick={() => startEdit(note)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold">{note.title || '无标题'}</h4>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  className="text-lg opacity-50 hover:opacity-100"
                >
                  ×
                </button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <p className={`text-xs mt-2 opacity-60`}>
                {new Date(note.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StickyNotes;