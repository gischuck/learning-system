import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/auth/LoginPage';
import Layout from './components/layout/Layout';
import Dashboard from './components/common/Dashboard';
import Plans from './components/plans/Plans';
import Notes from './components/notes/Notes';
import Stats from './components/stats/Stats';
import StarKidView from './components/kidview/StarKidView';
import Assignments from './components/assignments/Assignments';
import Todos from './components/todos/Todos';
import WishManagement from './components/wishes/WishManagement';
import ApprovalManagement from './components/approvals/ApprovalManagement';
import SmartAssistant from './components/common/SmartAssistant';
import DataManagement from './components/common/DataManagement';
import HabitManagement from './components/habits/HabitManagement';
import Settings, { getChildName } from './components/settings/Settings';

// 孩子看板模式（无需登录）
const KidMode = ({ onAdminLogin, darkMode, toggleTheme, handleOpenAssistant }) => {
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
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : ''}`}>
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/10 backdrop-blur-lg border-white/20'} border-b px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-50`}>
        <h1 className={`text-lg md:text-xl font-bold ${darkMode ? 'text-white' : 'text-amber-400'}`}>
          🌟 {childName} 星星学院
        </h1>
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => handleOpenAssistant && handleOpenAssistant()} className={`flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg ${darkMode ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-900' : 'bg-purple-500/30 text-purple-200 hover:bg-purple-500/50'}`}>
            <span className="text-lg">🤖</span>
            <span className="text-sm font-medium hidden md:inline">助手</span>
          </button>
          <button onClick={() => toggleTheme && toggleTheme(!darkMode)} className={`flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-white/10 text-white'}`}>
            <span className="text-lg">{darkMode ? '🌙' : '☀️'}</span>
            <span className="text-sm font-medium hidden md:inline">{darkMode ? '暗夜' : '明亮'}</span>
          </button>
          <button onClick={onAdminLogin} className="px-3 md:px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:scale-105 transition">
            父母管理
          </button>
        </div>
      </header>
      <StarKidView darkMode={darkMode} toggleTheme={toggleTheme} />
    </div>
  );
};

// 主应用内容
const AppContent = () => {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // 应用主题
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#111827';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '';
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = (isDark) => setDarkMode(isDark);

  const handleOpenAssistant = () => {
    console.log('Opening assistant...');
    setShowAssistant(true);
  };

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 已登录显示管理后台
  if (user) {
    const renderContent = () => {
      switch (activeTab) {
        case 'dashboard': return <Dashboard darkMode={darkMode} />;
        case 'todos': return <Todos darkMode={darkMode} />;
        case 'plans': return <Plans darkMode={darkMode} />;
        case 'notes': return <Notes darkMode={darkMode} />;
        case 'stats': return <Stats darkMode={darkMode} />;
        case 'kidview': return <StarKidView darkMode={darkMode} toggleTheme={toggleTheme} />;
        case 'assignments': return <Assignments darkMode={darkMode} />;
        case 'wishes': return <WishManagement darkMode={darkMode} />;
        case 'habits': return <HabitManagement darkMode={darkMode} />;
        case 'approvals': return <ApprovalManagement darkMode={darkMode} />;
        case 'settings': return <Settings darkMode={darkMode} />;
        default: return <Dashboard darkMode={darkMode} />;
      }
    };

    return (
      <>
        <Layout 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user} 
          logout={logout}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          handleOpenAssistant={handleOpenAssistant}
          handleOpenDataManagement={() => setShowDataManagement(true)}
        >
          {renderContent()}
        </Layout>
        <SmartAssistant isOpen={showAssistant} onClose={() => setShowAssistant(false)} />
        <DataManagement isOpen={showDataManagement} onClose={() => setShowDataManagement(false)} darkMode={darkMode} />
      </>
    );
  }

  // 显示登录页（点击父母管理后）
  if (showLogin) {
    return <LoginPage onBack={() => setShowLogin(false)} />;
  }

  // 默认显示孩子看板（无需登录）
  return (
    <>
      <KidMode onAdminLogin={() => setShowLogin(true)} darkMode={darkMode} toggleTheme={toggleTheme} handleOpenAssistant={handleOpenAssistant} />
      <SmartAssistant isOpen={showAssistant} onClose={() => setShowAssistant(false)} />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;