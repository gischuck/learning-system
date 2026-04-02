import React, { useState, useEffect } from 'react';

// 默认配置
const defaultSettings = {
  childName: 'William',
  childGrade: '三年级',
  targetSchool: '海淀六小强',
  parentName: '家长',
};

const Settings = ({ darkMode = false, onUpdate }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('systemSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 通知父组件设置已更新
    if (onUpdate) {
      onUpdate(settings);
    }
  }, [settings, onUpdate]);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    
    // 触发全局事件，通知其他组件更新
    window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>⚙️ 系统设置</h2>

      {/* 基本信息设置 */}
      <div className={`rounded-xl shadow-sm p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>👶 孩子信息</h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              孩子名称
            </label>
            <input
              type="text"
              value={settings.childName}
              onChange={(e) => handleChange('childName', e.target.value)}
              placeholder="输入孩子名称"
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
              }`}
            />
            <p className={`mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              这个名称会显示在系统各处，如看板标题、欢迎语等
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              年级
            </label>
            <select
              value={settings.childGrade}
              onChange={(e) => handleChange('childGrade', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
              }`}
            >
              <option value="一年级">一年级</option>
              <option value="二年级">二年级</option>
              <option value="三年级">三年级</option>
              <option value="四年级">四年级</option>
              <option value="五年级">五年级</option>
              <option value="六年级">六年级</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              目标学校
            </label>
            <input
              type="text"
              value={settings.targetSchool}
              onChange={(e) => handleChange('targetSchool', e.target.value)}
              placeholder="如：海淀六小强"
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 家长信息 */}
      <div className={`rounded-xl shadow-sm p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>👤 家长信息</h3>
        
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            家长称呼
          </label>
          <input
            type="text"
            value={settings.parentName}
            onChange={(e) => handleChange('parentName', e.target.value)}
            placeholder="如：爸爸、妈妈"
            className={`w-full px-4 py-3 rounded-lg border transition-colors ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
            }`}
          />
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          💾 保存设置
        </button>
        
        {saved && (
          <span className="text-green-500 font-medium animate-pulse">
            ✅ 已保存
          </span>
        )}
      </div>

      {/* 预览 */}
      <div className={`rounded-xl shadow-sm p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>👀 预览效果</h3>
        
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {settings.childName[0]}
            </div>
            <div>
              <h1 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {settings.childName} 学习规划工作台
              </h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {settings.childGrade} · {settings.targetSchool}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 导出获取设置的辅助函数
export const getSettings = () => {
  const saved = localStorage.getItem('systemSettings');
  return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
};

// 导出获取孩子名称的辅助函数
export const getChildName = () => {
  return getSettings().childName;
};

export default Settings;