import React, { useState, useEffect } from 'react';

const HabitManagement = ({ darkMode = false }) => {
  const [habitRules, setHabitRules] = useState(() => {
    const saved = localStorage.getItem('habitRules');
    return saved ? JSON.parse(saved) : {
      early_sleep: { name: '早睡', icon: '🌙', reward: 6, penalty: -8, type: 'positive' },
      early_wake: { name: '早起', icon: '☀️', reward: 8, penalty: -10, type: 'positive' },
      pack_bag: { name: '收书包', icon: '🎒', reward: 2, penalty: -3, type: 'positive' },
      play_game: { name: '玩游戏', icon: '🎮', reward: 0, penalty: -10, type: 'negative' },
      watch_tv: { name: '偷看电视', icon: '📺', reward: 0, penalty: -5, type: 'negative' },
      incomplete_homework: { name: '漏作业', icon: '📝', reward: 0, penalty: -10, type: 'negative' }
    };
  });
  
  const [editingHabit, setEditingHabit] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabit, setNewHabit] = useState({ key: '', name: '', icon: '📋', reward: 0, penalty: -5, type: 'negative' });

  useEffect(() => {
    localStorage.setItem('habitRules', JSON.stringify(habitRules));
  }, [habitRules]);

  const updateHabit = (key, field, value) => {
    setHabitRules(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const deleteHabit = (key) => {
    if (!confirm(`确定删除"${habitRules[key]?.name}"吗？`)) return;
    const newRules = { ...habitRules };
    delete newRules[key];
    setHabitRules(newRules);
  };

  const addHabit = () => {
    if (!newHabit.key || !newHabit.name) {
      alert('请填写完整信息');
      return;
    }
    setHabitRules(prev => ({
      ...prev,
      [newHabit.key]: {
        name: newHabit.name,
        icon: newHabit.icon,
        reward: parseInt(newHabit.reward) || 0,
        penalty: parseInt(newHabit.penalty) || 0,
        type: newHabit.type
      }
    }));
    setShowAddModal(false);
    setNewHabit({ key: '', name: '', icon: '📋', reward: 0, penalty: -5, type: 'negative' });
  };

  const positiveHabits = Object.entries(habitRules).filter(([_, h]) => h.type === 'positive');
  const negativeHabits = Object.entries(habitRules).filter(([_, h]) => h.type === 'negative');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          🎯 习惯打卡设置
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + 添加习惯
        </button>
      </div>

      {/* 说明 */}
      <div className={`rounded-xl p-4 ${darkMode ? 'bg-amber-900/30 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`}>
        <p className={`text-sm ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
          💡 <strong>设置说明：</strong>
          <br />• <strong>正面习惯</strong>：孩子完成获得星星，未完成扣除星星
          <br />• <strong>负面习惯</strong>：点击直接扣除星星（如玩游戏、偷看电视等）
          <br />• 修改后自动保存，孩子看板会立即生效
        </p>
      </div>

      {/* 正面习惯 */}
      <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          ✅ 正面习惯（奖励）
        </h3>
        <div className="space-y-4">
          {positiveHabits.map(([key, habit]) => (
            <div key={key} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-green-50'} border ${darkMode ? 'border-gray-600' : 'border-green-200'}`}>
              <div className="flex items-center gap-4">
                <span className="text-3xl">{habit.icon}</span>
                <div className="flex-1">
                  {editingHabit === key ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={habit.name}
                        onChange={(e) => updateHabit(key, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border"
                        placeholder="习惯名称"
                      />
                      <div className="flex gap-4">
                        <div>
                          <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>完成奖励</label>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateHabit(key, 'reward', Math.max(0, habit.reward - 1))} className="w-8 h-8 rounded bg-gray-200 text-gray-700 font-bold">-</button>
                            <input type="number" value={habit.reward} onChange={(e) => updateHabit(key, 'reward', parseInt(e.target.value) || 0)} className="w-16 text-center px-2 py-1 rounded border" />
                            <button onClick={() => updateHabit(key, 'reward', habit.reward + 1)} className="w-8 h-8 rounded bg-gray-200 text-gray-700 font-bold">+</button>
                          </div>
                        </div>
                        <div>
                          <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>未完成扣除</label>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateHabit(key, 'penalty', Math.min(0, habit.penalty + 1))} className="w-8 h-8 rounded bg-gray-200 text-gray-700 font-bold">+</button>
                            <input type="number" value={habit.penalty} onChange={(e) => updateHabit(key, 'penalty', parseInt(e.target.value) || 0)} className="w-16 text-center px-2 py-1 rounded border" />
                            <button onClick={() => updateHabit(key, 'penalty', habit.penalty - 1)} className="w-8 h-8 rounded bg-gray-200 text-gray-700 font-bold">-</button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setEditingHabit(null)} className="px-3 py-1 bg-green-500 text-white rounded">保存</button>
                        <button onClick={() => deleteHabit(key)} className="px-3 py-1 bg-red-500 text-white rounded">删除</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{habit.name}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          完成 <span className="text-green-500 font-medium">+{habit.reward}⭐</span>
                          {' · '}
                          未完成 <span className="text-red-500 font-medium">{habit.penalty}⭐</span>
                        </p>
                      </div>
                      <button onClick={() => setEditingHabit(key)} className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                        编辑
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 负面习惯 */}
      <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          ⚠️ 负面习惯（惩罚）
        </h3>
        <div className="space-y-4">
          {negativeHabits.map(([key, habit]) => (
            <div key={key} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-rose-50'} border ${darkMode ? 'border-gray-600' : 'border-rose-200'}`}>
              <div className="flex items-center gap-4">
                <span className="text-3xl">{habit.icon}</span>
                <div className="flex-1">
                  {editingHabit === key ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={habit.name}
                        onChange={(e) => updateHabit(key, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border"
                        placeholder="习惯名称"
                      />
                      <div>
                        <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>点击扣除星星</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateHabit(key, 'penalty', Math.min(0, habit.penalty + 1))} className="w-8 h-8 rounded bg-gray-200 text-gray-700 font-bold">+</button>
                          <input type="number" value={habit.penalty} onChange={(e) => updateHabit(key, 'penalty', parseInt(e.target.value) || 0)} className="w-16 text-center px-2 py-1 rounded border" />
                          <button onClick={() => updateHabit(key, 'penalty', habit.penalty - 1)} className="w-8 h-8 rounded bg-gray-200 text-gray-700 font-bold">-</button>
                          <span className="text-red-500 font-medium">⭐</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setEditingHabit(null)} className="px-3 py-1 bg-green-500 text-white rounded">保存</button>
                        <button onClick={() => deleteHabit(key)} className="px-3 py-1 bg-red-500 text-white rounded">删除</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{habit.name}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          点击扣除 <span className="text-red-500 font-medium">{habit.penalty}⭐</span>
                        </p>
                      </div>
                      <button onClick={() => setEditingHabit(key)} className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                        编辑
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 添加习惯弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              ➕ 添加新习惯
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>类型</label>
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => setNewHabit({ ...newHabit, type: 'positive', reward: 5, penalty: -3 })}
                    className={`flex-1 py-2 rounded-lg font-medium ${newHabit.type === 'positive' ? 'bg-green-500 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                  >
                    正面习惯
                  </button>
                  <button 
                    onClick={() => setNewHabit({ ...newHabit, type: 'negative', reward: 0, penalty: -5 })}
                    className={`flex-1 py-2 rounded-lg font-medium ${newHabit.type === 'negative' ? 'bg-rose-500 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                  >
                    负面习惯
                  </button>
                </div>
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>习惯名称</label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className={`w-full mt-1 px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-300'} border`}
                  placeholder="如：练琴、做家务"
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>图标</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {['📋', '🎵', '🧹', '🍽️', '📖', '💪', '🏃', '🎨', '🎮', '📺', '📱', '💤'].map(icon => (
                    <button
                      key={icon}
                      onClick={() => setNewHabit({ ...newHabit, icon })}
                      className={`text-2xl p-2 rounded-xl ${newHabit.icon === icon ? 'bg-indigo-500' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              {newHabit.type === 'positive' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>完成奖励 ⭐</label>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => setNewHabit({ ...newHabit, reward: Math.max(0, newHabit.reward - 1) })} className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 font-bold">-</button>
                      <input type="number" value={newHabit.reward} onChange={(e) => setNewHabit({ ...newHabit, reward: parseInt(e.target.value) || 0 })} className="w-16 text-center px-2 py-2 rounded-lg border" />
                      <button onClick={() => setNewHabit({ ...newHabit, reward: newHabit.reward + 1 })} className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 font-bold">+</button>
                    </div>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>未完成扣除 ⭐</label>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => setNewHabit({ ...newHabit, penalty: newHabit.penalty + 1 })} className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 font-bold">+</button>
                      <input type="number" value={newHabit.penalty} onChange={(e) => setNewHabit({ ...newHabit, penalty: parseInt(e.target.value) || 0 })} className="w-16 text-center px-2 py-2 rounded-lg border" />
                      <button onClick={() => setNewHabit({ ...newHabit, penalty: newHabit.penalty - 1 })} className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 font-bold">-</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>点击扣除 ⭐</label>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => setNewHabit({ ...newHabit, penalty: newHabit.penalty + 1 })} className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 font-bold">+</button>
                    <input type="number" value={newHabit.penalty} onChange={(e) => setNewHabit({ ...newHabit, penalty: parseInt(e.target.value) || 0 })} className="w-16 text-center px-2 py-2 rounded-lg border" />
                    <button onClick={() => setNewHabit({ ...newHabit, penalty: newHabit.penalty - 1 })} className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 font-bold">-</button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                取消
              </button>
              <button onClick={addHabit} className="flex-1 py-3 rounded-xl font-medium bg-indigo-600 text-white hover:bg-indigo-700">
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitManagement;