import React, { useState, useEffect } from 'react';

const menuItems = [
  { id: 'dashboard', label: '控制台', icon: '📊' },
  { id: 'todos', label: '近期待办', icon: '📋' },
  { id: 'assignments', label: '作业布置', icon: '📝' },
  { id: 'wishes', label: '心愿管理', icon: '💎' },
  { id: 'habits', label: '习惯设置', icon: '🎯' },
  { id: 'approvals', label: '审核管理', icon: '✅' },
  { id: 'plans', label: '学习规划', icon: '📚' },
  { id: 'notes', label: '育儿笔记', icon: '📖' },
  { id: 'stats', label: '统计分析', icon: '📈' },
  { id: 'kidview', label: '孩子看板', icon: '👦' },
  { id: 'settings', label: '系统设置', icon: '⚙️' },
];

// 获取孩子名称的辅助函数
const getChildName = () => {
  try {
    const saved = localStorage.getItem('systemSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      return settings.childName || 'William';
    }
  } catch (e) {}
  return 'William';
};

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, user, logout, darkMode, toggleTheme }) => {
  const [childName, setChildName] = useState(getChildName());

  // 监听设置更新
  useEffect(() => {
    const handleSettingsUpdate = (e) => {
      if (e.detail?.childName) {
        setChildName(e.detail.childName);
      }
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">{childName[0]}</div>
            <div>
              <h1 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{childName} 学习规划工作台</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>海淀小升初规划</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all text-left ${activeTab === item.id ? (darkMode ? 'bg-indigo-900/50 text-indigo-300 font-medium' : 'bg-indigo-50 text-indigo-700 font-medium') : (darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}`}
            >
              <span className="text-xl w-8 text-center">{item.icon}</span>
              <span className="text-base">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.displayName?.[0] || user?.username?.[0] || 'W'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>{user?.displayName || user?.username}</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>家长</p>
            </div>
            {logout && (
              <button onClick={logout} className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`} title="退出登录">🚪</button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;