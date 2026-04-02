import React, { useState, useEffect } from 'react';

const ApprovalManagement = ({ darkMode = false }) => {
  const [pendingItems, setPendingItems] = useState({ assignments: [], todos: [] });
  const [historyItems, setHistoryItems] = useState({ assignments: [], todos: [] });
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingItems();
    fetchHistoryItems();
  }, []);

  const fetchPendingItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/approvals/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setPendingItems(result.data);
      }
    } catch (error) {
      console.error('获取待审核列表失败:', error);
    }
  };

  const fetchHistoryItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/approvals/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setHistoryItems(result.data);
      }
    } catch (error) {
      console.error('获取审核历史失败:', error);
    }
  };

  const handleApproval = async (type, id, approved, notes = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'assignment' ? `/api/approvals/assignment/${id}` : `/api/approvals/todo/${id}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ approved, notes })
      });

      const result = await response.json();
      if (result.success) {
        fetchPendingItems();
        fetchHistoryItems();
      } else {
        alert(result.message || '操作失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      alert('操作失败');
    }
    setLoading(false);
  };

  const pendingCount = pendingItems.assignments.length + pendingItems.todos.length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* 头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            ✅ 审核管理
          </h2>
          {pendingCount > 0 && (
            <div className="text-orange-500 text-sm mt-1">
              有 {pendingCount} 项待审核
            </div>
          )}
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'pending' 
              ? 'bg-orange-500 text-white' 
              : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')
          }`}
        >
          待审核 {pendingCount > 0 && `(${pendingCount})`}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'history' 
              ? 'bg-indigo-600 text-white' 
              : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')
          }`}
        >
          审核历史
        </button>
      </div>

      {/* 待审核列表 */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {/* 待审核作业 */}
          {pendingItems.assignments.length > 0 && (
            <div>
              <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📝 作业任务
              </h3>
              <div className="space-y-2">
                {pendingItems.assignments.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.title}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                            ⭐ {item.starReward || 5}
                          </span>
                        </div>
                        <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.subject} · {item.completedAt && new Date(item.completedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleApproval('assignment', item.id, true)}
                        disabled={loading}
                        className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50"
                      >
                        ✅ 通过
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('拒绝原因（可选）');
                          if (notes !== null) handleApproval('assignment', item.id, false, notes);
                        }}
                        disabled={loading}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50"
                      >
                        ❌ 拒绝
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 待审核待办 */}
          {pendingItems.todos.length > 0 && (
            <div>
              <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📋 近期待办
              </h3>
              <div className="space-y-2">
                {pendingItems.todos.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.title}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                            ⭐ {item.points || 2}
                          </span>
                        </div>
                        <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.category} · {item.completedAt && new Date(item.completedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleApproval('todo', item.id, true)}
                        disabled={loading}
                        className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50"
                      >
                        ✅ 通过
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('拒绝原因（可选）');
                          if (notes !== null) handleApproval('todo', item.id, false, notes);
                        }}
                        disabled={loading}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50"
                      >
                        ❌ 拒绝
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 无待审核 */}
          {pendingItems.assignments.length === 0 && pendingItems.todos.length === 0 && (
            <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="text-5xl mb-4">✅</div>
              <p>暂无待审核项目</p>
            </div>
          )}
        </div>
      )}

      {/* 审核历史 */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* 已审核作业 */}
          {historyItems.assignments.length > 0 && (
            <div>
              <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📝 作业审核记录
              </h3>
              <div className="space-y-2">
                {historyItems.assignments.map(item => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border ${
                      item.approvalStatus === 'approved'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`font-medium ${item.approvalStatus === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                          {item.title}
                        </span>
                        {item.approvalStatus === 'approved' && (
                          <span className="text-xs ml-2 text-amber-600">+{item.starReward}⭐</span>
                        )}
                      </div>
                      <span className={`text-xs ${item.approvalStatus === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.approvalStatus === 'approved' ? '✅ 通过' : '❌ 拒绝'}
                      </span>
                    </div>
                    {item.approvalNotes && (
                      <div className="text-xs text-gray-500 mt-1">备注: {item.approvalNotes}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {item.approvedAt && new Date(item.approvedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 已审核待办 */}
          {historyItems.todos.length > 0 && (
            <div>
              <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📋 待办审核记录
              </h3>
              <div className="space-y-2">
                {historyItems.todos.map(item => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border ${
                      item.approvalStatus === 'approved'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`font-medium ${item.approvalStatus === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                          {item.title}
                        </span>
                        {item.approvalStatus === 'approved' && (
                          <span className="text-xs ml-2 text-amber-600">+{item.points}⭐</span>
                        )}
                      </div>
                      <span className={`text-xs ${item.approvalStatus === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.approvalStatus === 'approved' ? '✅ 通过' : '❌ 拒绝'}
                      </span>
                    </div>
                    {item.approvalNotes && (
                      <div className="text-xs text-gray-500 mt-1">备注: {item.approvalNotes}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {item.approvedAt && new Date(item.approvedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 无历史 */}
          {historyItems.assignments.length === 0 && historyItems.todos.length === 0 && (
            <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="text-5xl mb-4">📋</div>
              <p>暂无审核记录</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApprovalManagement;