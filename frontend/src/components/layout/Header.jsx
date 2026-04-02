import React, { useState, useEffect } from 'react';

const Header = ({ sidebarOpen, setSidebarOpen, user, logout, darkMode, toggleTheme, onOpenAssistant, onOpenDataManagement }) => {
  const currentDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // 加载通知
  useEffect(() => {
    fetchNotifications();
    
    // 每30秒刷新一次
    const interval = setInterval(fetchNotifications, 30000);
    
    // 监听通知更新事件
    const handleNotificationUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const allNotifications = [];
      
      // 1. 获取近期待办（15天内）- 只显示未读的
      const response = await fetch('/api/todos');
      const result = await response.json();
      
      if (result.success) {
        const today = new Date();
        const fifteenDaysLater = new Date();
        fifteenDaysLater.setDate(today.getDate() + 15);
        
        const upcoming = result.data
          .filter(t => t.status === 'pending' && t.dueDate)
          .filter(t => {
            const dueDate = new Date(t.dueDate);
            return dueDate >= today && dueDate <= fifteenDaysLater;
          })
          .map(t => ({
            id: `todo-${t.id}`,
            type: 'todo',
            title: t.title,
            message: `${t.category || '待办'} - ${t.dueDate}`,
            daysLeft: Math.ceil((new Date(t.dueDate) - today) / (1000 * 60 * 60 * 24)),
            createdAt: new Date().toISOString(),
            read: true // 待办提醒默认已读
          }));
        
        allNotifications.push(...upcoming);
      }
      
      // 2. 获取作业完成通知（从localStorage）- 只显示未读的
      const completionNotifications = JSON.parse(localStorage.getItem('completionNotifications') || '[]');
      const unreadCompletions = completionNotifications.filter(n => !n.read);
      allNotifications.push(...unreadCompletions);
      
      // 按时间排序
      allNotifications.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
      
      setNotifications(allNotifications);
    } catch (error) {
      console.error('获取通知失败:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  
  // 标记所有通知为已读
  const markAllAsRead = () => {
    // 更新localStorage中的通知为已读
    const completionNotifications = JSON.parse(localStorage.getItem('completionNotifications') || '[]');
    const updated = completionNotifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('completionNotifications', JSON.stringify(updated));
    
    // 刷新通知列表（已读的不会再显示）
    fetchNotifications();
  };

  // 同步功能
  const handleSync = async (type) => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sync/${type || 'all'}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setSyncMessage('同步成功！');
        setTimeout(() => setSyncMessage(''), 3000);
      } else {
        setSyncMessage('同步失败：' + result.message);
      }
    } catch (error) {
      setSyncMessage('同步失败：' + error.message);
    } finally {
      setIsSyncing(false);
      setShowSyncPanel(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('两次密码输入不一致');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
      });
      const result = await response.json();
      if (result.success) {
        setPasswordMessage('密码修改成功');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMessage(result.message || '修改失败');
      }
    } catch (error) {
      setPasswordMessage('修改失败，请重试');
    }
  };

  return (
    <header className={`border-b px-6 py-4 flex justify-between items-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg lg:hidden ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
          <svg className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <p className={`text-sm hidden lg:block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{currentDate}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* 智慧助手 */}
        <button 
          onClick={() => {
            console.log('智慧助手按钮被点击');
            if (onOpenAssistant) {
              onOpenAssistant();
            }
          }} 
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-900' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
        >
          <span className="text-lg">🤖</span>
          <span className="text-sm font-medium hidden md:inline">智慧助手</span>
        </button>

        {/* 暗黑模式切换 */}
        <button onClick={() => toggleTheme && toggleTheme(!darkMode)} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
          <span className="text-lg">{darkMode ? '🌙' : '☀️'}</span>
          <span className="text-sm font-medium hidden md:inline">{darkMode ? '暗夜' : '明亮'}</span>
        </button>

        <div className="relative">
          <button onClick={() => setShowSyncPanel(!showSyncPanel)} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isSyncing ? 'bg-gray-100 cursor-not-allowed' : (darkMode ? 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100')}`}>
            <span>{isSyncing ? '⏳' : '🔄'}</span><span className="font-medium">{isSyncing ? '同步中...' : '同步'}</span>
          </button>
          {showSyncPanel && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSyncPanel(false)} />
              <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border py-2 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <button onClick={() => handleSync('all')} className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 ${darkMode ? 'text-gray-200 hover:bg-gray-700' : ''}`}>🔄 全部同步</button>
                <button onClick={() => handleSync('plans')} className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 ${darkMode ? 'text-gray-200 hover:bg-gray-700' : ''}`}>📋 同步规划表</button>
                <button onClick={() => handleSync('notes')} className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 ${darkMode ? 'text-gray-200 hover:bg-gray-700' : ''}`}>📝 同步育儿经验</button>
                <div className={`border-t my-1 ${darkMode ? 'border-gray-700' : ''}`}></div>
                <div className={`px-4 py-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>每天 02:00 自动同步</div>
              </div>
            </>
          )}
        </div>

        {syncMessage && (
          <div className={`px-3 py-1 rounded-lg text-sm ${syncMessage.includes('失败') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {syncMessage}
          </div>
        )}

        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className={`relative p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <span className="text-xl">🔔</span>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl border z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-4 py-3 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : ''}`}>
                  <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>🔔 通知</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-indigo-500 hover:text-indigo-600">全部已读</button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b last:border-b-0 ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {n.title}
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {n.type === 'assignment_completed' ? n.message : (
                          n.daysLeft <= 0 ? '🔴 已过期' : n.daysLeft === 1 ? '🟠 明天截止' : `📅 ${n.daysLeft}天后`
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className={`px-4 py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="text-3xl mb-2">✨</div>
                      <p>暂无新通知</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setShowUserPanel(!showUserPanel)} className={`flex items-center gap-3 p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.displayName?.[0] || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{user?.displayName || user?.username}</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>家长</p>
            </div>
          </button>

          {showUserPanel && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserPanel(false)} />
              <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border py-2 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <button onClick={() => { if (onOpenDataManagement) onOpenDataManagement(); setShowUserPanel(false); }} className={`w-full text-left px-4 py-2.5 flex items-center gap-2 ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <span>💾</span> 数据管理
                </button>
                <button onClick={() => { setShowSettingsPanel(true); setShowUserPanel(false); }} className={`w-full text-left px-4 py-2.5 flex items-center gap-2 ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <span>⚙️</span> 设置
                </button>
                <div className={`border-t my-1 ${darkMode ? 'border-gray-700' : ''}`}></div>
                <button onClick={() => { logout(); setShowUserPanel(false); }} className={`w-full text-left px-4 py-2.5 flex items-center gap-2 text-red-600 ${darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}>
                  <span>🚪</span> 退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 设置面板 */}
      {showSettingsPanel && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md mx-4 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : ''}`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>⚙️ 设置</h2>
              <button onClick={() => setShowSettingsPanel(false)} className={`text-2xl ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>×</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 修改密码 */}
              <div>
                <p className={`font-medium mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>🔐 修改密码</p>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <input type="password" placeholder="当前密码" value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  <input type="password" placeholder="新密码" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  <input type="password" placeholder="确认新密码" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  {passwordMessage && <p className={`text-sm ${passwordMessage.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{passwordMessage}</p>}
                  <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">确认修改</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;