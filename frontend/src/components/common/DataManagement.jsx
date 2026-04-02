import React, { useState } from 'react';
import Modal from './Modal';

const DataManagement = ({ isOpen, onClose, darkMode }) => {
  const [showConfirm, setShowConfirm] = useState(null);
  const [message, setMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState(null);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sync/export', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        // 下载 JSON 文件
        const data = JSON.stringify(result.data, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `william_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage('✅ 数据导出成功！');
      } else {
        setMessage('❌ 导出失败：' + result.message);
      }
    } catch (error) {
      setMessage('❌ 导出失败：' + error.message);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sync/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ data })
      });
      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ 导入成功！\n- 规划：${result.stats?.plans || 0} 条\n- 待办：${result.stats?.todos || 0} 条\n- 课程：${result.stats?.schedules || 0} 条\n- 作业：${result.stats?.assignments || 0} 条`);
      } else {
        setMessage('❌ 导入失败：' + result.message);
      }
    } catch (error) {
      setMessage('❌ 导入失败：文件格式错误');
    }
    
    e.target.value = '';
  };

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sync/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setMessage('✅ 数据库备份成功！文件已保存到服务器。');
      } else {
        setMessage('❌ 备份失败：' + result.message);
      }
    } catch (error) {
      setMessage('❌ 备份失败：' + error.message);
    }
    setShowConfirm(null);
  };

  // 完整Google同步
  const handleGoogleSync = async () => {
    setSyncing(true);
    setMessage('🔄 正在同步到 Google...');
    setSyncResults(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sync/all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        const successCount = result.details?.filter(r => r.success).length || 0;
        const totalCount = result.details?.length || 0;
        setMessage(`✅ 同步完成！成功：${successCount}/${totalCount} 项`);
        setSyncResults(result.details);
      } else {
        setMessage('❌ 同步失败');
      }
    } catch (error) {
      setMessage('❌ 同步失败：' + error.message);
    }
    
    setSyncing(false);
  };

  // 单项同步
  const handleSingleSync = async (type) => {
    setSyncing(true);
    setMessage(`🔄 正在同步${getSyncTypeName(type)}...`);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sync/${type}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ ${result.message}`);
      } else {
        setMessage(`❌ 同步失败：${result.error || result.message}`);
      }
    } catch (error) {
      setMessage('❌ 同步失败：' + error.message);
    }
    
    setSyncing(false);
  };

  const getSyncTypeName = (type) => {
    const names = {
      plans: '规划',
      todos: '待办',
      notes: '笔记',
      wishes: '心愿',
      assignments: '作业',
      stars: '星星记录',
      habits: '习惯打卡'
    };
    return names[type] || type;
  };

  if (!isOpen) return null;

  const syncItems = [
    { key: 'plans', icon: '📚', name: '学习规划' },
    { key: 'todos', icon: '📋', name: '待办事项' },
    { key: 'wishes', icon: '💎', name: '心愿单' },
    { key: 'assignments', icon: '📝', name: '作业布置' },
    { key: 'stars', icon: '⭐', name: '星星记录' },
    { key: 'habits', icon: '🎯', name: '习惯打卡' },
    { key: 'notes', icon: '📖', name: '育儿笔记' }
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className={`rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b sticky top-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                💾 数据管理
              </h3>
              <button onClick={onClose} className={`text-2xl ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                ×
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Google 同步 */}
            <div className={`rounded-xl p-4 ${darkMode ? 'bg-indigo-900/30 border border-indigo-700' : 'bg-indigo-50 border border-indigo-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className={`font-bold ${darkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                    🔄 Google 同步
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    同步数据到 Google Sheets / Docs
                  </p>
                </div>
                <button
                  onClick={handleGoogleSync}
                  disabled={syncing}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    syncing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {syncing ? '同步中...' : '一键同步'}
                </button>
              </div>
              
              {/* 单项同步 */}
              <div className="grid grid-cols-4 gap-2">
                {syncItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleSingleSync(item.key)}
                    disabled={syncing}
                    className={`p-2 rounded-lg text-center transition-all ${
                      syncing
                        ? 'bg-gray-400/20 cursor-not-allowed'
                        : darkMode
                          ? 'bg-gray-700 hover:bg-indigo-600 text-gray-300'
                          : 'bg-white hover:bg-indigo-100 text-gray-700'
                    }`}
                  >
                    <div className="text-lg">{item.icon}</div>
                    <div className="text-xs mt-1">{item.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 同步结果 */}
            {syncResults && (
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h4 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  📊 同步结果
                </h4>
                <div className="space-y-2">
                  {syncResults.map((r, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {r.type === 'import_todos' ? '📥 导入待办' :
                         r.type === 'plans' ? '📚 规划' :
                         r.type === 'todos' ? '📋 待办' :
                         r.type === 'stickyNotes' ? '📌 便签' :
                         r.type === 'notes' ? '📖 笔记' :
                         r.type === 'wishes' ? '💎 心愿' :
                         r.type === 'assignments' ? '📝 作业' :
                         r.type === 'starRecords' ? '⭐ 星星记录' :
                         r.type === 'habitRecords' ? '🎯 习惯打卡' :
                         r.type === 'backup' ? '💿 备份' : r.type}
                      </span>
                      <span className={r.success ? 'text-green-500' : 'text-red-500'}>
                        {r.success ? `✓ ${r.count || ''}` : `✗ ${r.error || ''}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 数据导入导出 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 导出 */}
              <button
                onClick={handleExport}
                className={`px-4 py-4 rounded-xl border-2 text-left transition-all ${darkMode ? 'border-gray-600 hover:border-indigo-500 bg-gray-700' : 'border-gray-200 hover:border-indigo-300'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📤</span>
                  <div>
                    <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>导出数据</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>下载 JSON 文件</div>
                  </div>
                </div>
              </button>

              {/* 导入 */}
              <label className={`block px-4 py-4 rounded-xl border-2 text-left transition-all cursor-pointer ${darkMode ? 'border-gray-600 hover:border-indigo-500 bg-gray-700' : 'border-gray-200 hover:border-indigo-300'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📥</span>
                  <div>
                    <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>导入数据</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>从 JSON 恢复</div>
                  </div>
                </div>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>

            {/* 服务器备份 */}
            <button
              onClick={() => setShowConfirm('backup')}
              className={`w-full px-4 py-4 rounded-xl border-2 text-left transition-all ${darkMode ? 'border-gray-600 hover:border-green-500 bg-gray-700' : 'border-gray-200 hover:border-green-300'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💿</span>
                <div>
                  <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>服务器备份</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>备份数据库到服务器本地（保留30天）</div>
                </div>
              </div>
            </button>

            {/* 消息提示 */}
            {message && (
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <pre className={`text-sm whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{message}</pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 确认对话框 */}
      <Modal
        isOpen={showConfirm === 'backup'}
        onClose={() => setShowConfirm(null)}
        onConfirm={handleBackup}
        title="确认备份"
        message="确定要备份数据库吗？备份文件将保存到服务器。"
        confirmText="确认备份"
        type="confirm"
      />
    </>
  );
};

export default DataManagement;