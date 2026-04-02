import React, { useState, useEffect, useRef } from 'react';
import StickyNotes from './StickyNotes';

// 默认学校课程表（周一到周日）
const defaultSchoolSchedule = [
  { day: 1, courses: ['数学', '科学', '道德与法治', '班队会', '体育', '信息科技'] },
  { day: 2, courses: ['语文', '数学', '书法', '美术', '艺术欣赏', '跳绳', 'C++ 普及班'] },
  { day: 3, courses: ['数学实践', '语文', '英语', '道德与法治', '体育', '语文'] },
  { day: 4, courses: ['数学', '语文', '体育', '音乐', '京剧', '跳绳'] },
  { day: 5, courses: ['数学', '语文', '体育', '英语', '科学'] },
  { day: 6, courses: [] },
  { day: 0, courses: [] },
];

// 默认课外班数据
const defaultCourses = [
  { id: 1, name: '高思数学', day: 1, startTime: '18:00', endTime: '20:30', location: '和盛大厦 6 层 27 教室', teacher: '张老师', subject: 'math', type: '课外' },
  { id: 2, name: '厚海英语', day: 3, startTime: '18:20', endTime: '20:20', location: '新中关 7 层 705', teacher: '李老师', subject: 'english', type: '课外' },
  { id: 3, name: '优才数学', day: 5, startTime: '17:30', endTime: '20:30', location: '知春大厦 7 层 1 教室', teacher: '王老师', subject: 'math', type: '课外' },
  { id: 4, name: '羽毛球', day: 0, startTime: '10:30', endTime: '12:00', location: '体育中心', teacher: '教练', subject: 'sports', type: '体育' },
  { id: 5, name: '习墨写字', day: 0, startTime: '17:20', endTime: '18:50', location: '书法教室', teacher: '书法老师', subject: 'art', type: '艺术' },
];

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const dayOrder = [1, 2, 3, 4, 5, 6, 0];

const getSubjectColors = (darkMode) => ({
  math: darkMode ? 'bg-blue-900/50 text-blue-200 border-blue-600' : 'bg-blue-100 border-blue-300 text-blue-800',
  english: darkMode ? 'bg-green-900/50 text-green-200 border-green-600' : 'bg-green-100 border-green-300 text-green-800',
  chinese: darkMode ? 'bg-red-900/50 text-red-200 border-red-600' : 'bg-red-100 border-red-300 text-red-800',
  sports: darkMode ? 'bg-orange-900/50 text-orange-200 border-orange-600' : 'bg-orange-100 border-orange-300 text-orange-800',
  art: darkMode ? 'bg-purple-900/50 text-purple-200 border-purple-600' : 'bg-purple-100 border-purple-300 text-purple-800',
  science: darkMode ? 'bg-cyan-900/50 text-cyan-200 border-cyan-600' : 'bg-cyan-100 border-cyan-300 text-cyan-800',
  other: darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 border-gray-300 text-gray-800',
});

const subjectNames = { math: '数学', english: '英语', chinese: '语文', sports: '体育', art: '艺术', science: '科学', other: '其他' };

// 可编辑课程组件
const EditableCourse = ({ course, onSave, darkMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(course);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== course) {
      onSave(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setValue(course);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`text-xs p-1.5 rounded mb-1 w-full ${darkMode ? 'bg-blue-800 text-white' : 'bg-white border border-blue-300 text-blue-800'}`}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`text-xs p-1.5 rounded mb-1 cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all ${darkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-50 text-blue-700'}`}
    >
      {course}
    </div>
  );
};

const Plans = ({ darkMode = false }) => {
  const [courses, setCourses] = useState(defaultCourses);
  const [schoolSchedule, setSchoolSchedule] = useState(() => {
    const saved = localStorage.getItem('schoolSchedule');
    return saved ? JSON.parse(saved) : defaultSchoolSchedule;
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [formData, setFormData] = useState({
    name: '', day: 1, startTime: '18:00', endTime: '20:00', location: '', teacher: '', subject: 'math', type: '课外'
  });

  // 从 API 加载课程
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/schedules');
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // 标准化字段名：API返回的 dayOfWeek -> day, title -> name
        const normalized = data.data.map(c => ({
          ...c,
          id: c.id,
          name: c.title || c.name,
          day: c.dayOfWeek !== undefined ? c.dayOfWeek : c.day,
          startTime: c.startTime,
          endTime: c.endTime,
          location: c.location,
          teacher: c.teacher,
          subject: c.subject,
          type: c.type
        }));
        setCourses(normalized);
      } else {
        // API 无数据，使用默认数据并保存到数据库
        setCourses(defaultCourses);
        
        // 将默认数据保存到数据库
        const token = localStorage.getItem('token');
        for (const course of defaultCourses) {
          try {
            await fetch('/api/schedules', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                title: course.name,
                subject: course.subject,
                dayOfWeek: course.day,
                startTime: course.startTime,
                endTime: course.endTime,
                location: course.location || '',
                teacher: course.teacher || '',
                type: course.type || '课外'
              })
            });
          } catch (e) {
            console.error('保存默认课程失败:', e);
          }
        }
      }
    } catch (error) {
      console.error('获取课程失败:', error);
      // 失败时使用默认数据
      setCourses(defaultCourses);
    }
  };

  // 保存校内课程到本地存储
  const saveSchoolSchedule = (newSchedule) => {
    setSchoolSchedule(newSchedule);
    localStorage.setItem('schoolSchedule', JSON.stringify(newSchedule));
  };

  // 更新校内课程
  const updateSchoolCourse = (dayIndex, courseIndex, newCourse) => {
    const newSchedule = schoolSchedule.map(s => {
      if (s.day === dayIndex) {
        const newCourses = [...s.courses];
        newCourses[courseIndex] = newCourse;
        return { ...s, courses: newCourses };
      }
      return s;
    });
    saveSchoolSchedule(newSchedule);
  };

  // 添加校内课程
  const addSchoolCourse = (dayIndex) => {
    const newSchedule = schoolSchedule.map(s => {
      if (s.day === dayIndex) {
        return { ...s, courses: [...s.courses, '新课程'] };
      }
      return s;
    });
    saveSchoolSchedule(newSchedule);
  };

  // 删除校内课程
  const deleteSchoolCourse = (dayIndex, courseIndex) => {
    if (!confirm('确定删除这节课吗？')) return;
    const newSchedule = schoolSchedule.map(s => {
      if (s.day === dayIndex) {
        const newCourses = s.courses.filter((_, i) => i !== courseIndex);
        return { ...s, courses: newCourses };
      }
      return s;
    });
    saveSchoolSchedule(newSchedule);
  };

  const resetForm = () => {
    setFormData({ name: '', day: 1, startTime: '18:00', endTime: '20:00', location: '', teacher: '', subject: 'math', type: '课外' });
    setEditingCourse(null);
    setShowAddForm(false);
  };

  const addCourse = async () => {
    if (!formData.name) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: formData.name,
          dayOfWeek: formData.day,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          teacher: formData.teacher,
          subject: formData.subject,
          type: formData.type
        })
      });
      const result = await response.json();
      if (result.success) {
        // 添加成功，重新获取列表
        fetchCourses();
      }
      resetForm();
    } catch (error) {
      console.error('添加课程失败:', error);
      alert('添加失败，请重试');
    }
  };

  const startEdit = (course) => {
    setEditingCourse(course);
    setFormData({ 
      ...course,
      name: course.title || course.name,
      day: course.dayOfWeek !== undefined ? course.dayOfWeek : course.day
    });
    setShowAddForm(true);
  };

  const updateCourse = async () => {
    if (!formData.name || !editingCourse) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/schedules/${editingCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: formData.name,
          dayOfWeek: formData.day,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          teacher: formData.teacher,
          subject: formData.subject,
          type: formData.type
        })
      });
      const result = await response.json();
      if (result.success) {
        // 更新成功，重新获取列表
        fetchCourses();
        resetForm();
      } else {
        alert(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新课程失败:', error);
      alert('更新失败，请重试');
    }
  };

  const deleteCourse = async (id) => {
    if (!confirm('确定删除这个课程吗？')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        // 删除成功，重新获取列表
        fetchCourses();
      }
      resetForm();
    } catch (error) {
      console.error('删除课程失败:', error);
      alert('删除失败，请重试');
    }
  };

  const subjectColors = getSubjectColors(darkMode);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>📚 学习规划</h2>
        <div className="flex gap-2">
          <button onClick={() => { setShowAddForm(true); setEditingCourse(null); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ 添加课外班</button>
        </div>
      </div>

      {/* 临时便签 */}
      <StickyNotes darkMode={darkMode} />

      {/* 添加/编辑表单 */}
      {showAddForm && (
        <div className={`rounded-2xl p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{editingCourse ? '编辑课程' : '添加新课程'}</h3>
            {editingCourse && (
              <button
                onClick={() => deleteCourse(editingCourse.id)}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                🗑️ 删除课程
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input type="text" placeholder="课程名称" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
            <select value={formData.day} onChange={e => setFormData({...formData, day: parseInt(e.target.value)})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
              {weekDays.map((day, i) => <option key={i} value={dayOrder[i]}>{day}</option>)}
            </select>
            <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
            <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
            <input type="text" placeholder="地点" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
            <input type="text" placeholder="老师" value={formData.teacher} onChange={e => setFormData({...formData, teacher: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
            <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
              {Object.entries(subjectNames).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
              <option value="课外">课外班</option>
              <option value="体育">体育</option>
              <option value="艺术">艺术</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={editingCourse ? updateCourse : addCourse} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{editingCourse ? '更新' : '保存'}</button>
            <button onClick={resetForm} className={`px-6 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>取消</button>
          </div>
        </div>
      )}

      {/* 完整课程表（学校 + 课外班） */}
      <div className={`rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className={`flex justify-between items-center p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>📆 完整课程表（学校 + 课外班）</h3>
          <span className={`text-xs hidden md:block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>校内课程点击编辑，课外班点击可编辑/删除</span>
        </div>
        {/* 横向滚动容器 */}
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-7 gap-2 min-w-[700px] p-4 pt-0">
            {dayOrder.map((dayIndex, i) => {
              const daySchool = schoolSchedule.find(s => s.day === dayIndex);
              // API 返回 dayOfWeek: 1-7，dayOrder 中周日是0，需要特殊处理
              const apiDayIndex = dayIndex === 0 ? 7 : dayIndex;
              const dayExternal = courses.filter(c => c.day === apiDayIndex || c.day === dayIndex);
              return (
                <div key={dayIndex} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-2 md:p-3 min-h-[300px] md:min-h-[400px]`}>
                  <div className={`text-center font-bold mb-2 md:mb-3 pb-2 border-b text-sm md:text-base ${darkMode ? 'text-gray-200 border-gray-600' : 'text-gray-700 border-gray-200'}`}>{weekDays[i]}</div>
                  <div className="space-y-1 md:space-y-2">
                    {/* 学校课程 */}
                    <div className="mb-1 md:mb-2">
                      <div className={`text-xs font-medium mb-1 flex items-center justify-between ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span>🏫</span>
                        <button 
                          onClick={() => addSchoolCourse(dayIndex)}
                          className="text-indigo-500 hover:text-indigo-700"
                        >
                          +
                        </button>
                      </div>
                      {daySchool?.courses && daySchool.courses.length > 0 ? (
                        daySchool.courses.map((c, j) => (
                          <div key={j} className="group relative">
                            <EditableCourse 
                              course={c} 
                              onSave={(newCourse) => updateSchoolCourse(dayIndex, j, newCourse)}
                              darkMode={darkMode}
                            />
                            <button
                              onClick={() => deleteSchoolCourse(dayIndex, j)}
                              className="absolute -right-1 -top-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-300'} text-center py-1`}>
                          <button 
                            onClick={() => addSchoolCourse(dayIndex)}
                            className="text-indigo-500 hover:text-indigo-700"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                    {/* 课外班 */}
                    {dayExternal.length > 0 && (
                      <div>
                        <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>🎯</div>
                        {dayExternal.map(course => (
                          <div 
                            key={course.id} 
                            onClick={() => startEdit(course)}
                            className={`text-xs p-1 md:p-1.5 rounded mb-1 cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all relative group ${subjectColors[course.subject] || subjectColors.other}`}
                          >
                            <div className="font-medium truncate">{course.name}</div>
                            <div className="text-xs opacity-75">{course.startTime}-{course.endTime}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {(!daySchool?.courses || daySchool.courses.length === 0) && dayExternal.length === 0 && (
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-300'} text-center py-4 md:py-8`}>无课</div>
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
    </div>
  );
};

export default Plans;