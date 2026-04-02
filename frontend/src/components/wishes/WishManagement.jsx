import React, { useState, useEffect } from 'react';

const WishManagement = ({ darkMode = false }) => {
  const [wishes, setWishes] = useState([]);
  const [starBalance, setStarBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [targetStars, setTargetStars] = useState(0);
  const [editingWish, setEditingWish] = useState(null);
  const [editStars, setEditStars] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWish, setNewWish] = useState({ name: '', starsRequired: 50, emoji: '🎁' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wishesRes, balanceRes] = await Promise.all([
        fetch('/api/wishes'),
        fetch('/api/stars/balance')
      ]);
      
      const wishesData = await wishesRes.json();
      const balanceData = await balanceRes.json();
      
      if (wishesData.success) setWishes(wishesData.data);
      if (balanceData.success) setStarBalance(balanceData.data.balance);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (wishId, starsRequired) => {
    try {
      const response = await fetch(`/api/wishes/${wishId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starsRequired })
      });
      
      const result = await response.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('审核心愿失败:', error);
    }
  };

  const handleReject = async (wishId) => {
    if (!window.confirm('确定要拒绝这个心愿吗？')) return;
    
    try {
      const response = await fetch(`/api/wishes/${wishId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      
      const result = await response.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('拒绝心愿失败:', error);
    }
  };

  const handleConfirmRedeem = async (wishId) => {
    try {
      const response = await fetch(`/api/wishes/${wishId}/confirm-redeem`, {
        method: 'PUT'
      });
      
      const result = await response.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('确认兑换失败:', error);
    }
  };

  const handleAddWish = async () => {
    if (!newWish.name.trim()) return;
    
    try {
      const response = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newWish.name.trim(),
          starsRequired: newWish.starsRequired,
          icon: newWish.emoji,
          status: 'approved' // 父母添加的直接通过
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setShowAddModal(false);
        setNewWish({ name: '', starsRequired: 50, emoji: '🎁' });
        fetchData();
      }
    } catch (error) {
      console.error('添加心愿失败:', error);
    }
  };

  const handleAdjustStars = async () => {
    const adjustAmount = targetStars - starBalance;
    if (adjustAmount === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stars/adjust', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: adjustAmount,
          description: adjustAmount > 0 ? '手动设置星星' : '手动设置星星'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        fetchData();
        setShowAdjustModal(false);
        setTargetStars(0);
      } else {
        alert(result.message || '调整失败');
      }
    } catch (error) {
      console.error('调整星星失败:', error);
      alert('调整失败，请重试');
    }
  };

  const handleUpdateWishStars = async (wish) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/wishes/${wish.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ starsRequired: parseInt(editStars) })
      });
      
      const result = await response.json();
      if (result.success) {
        setEditingWish(null);
        setEditStars('');
        fetchData();
      } else {
        alert(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新星星数失败:', error);
      alert('更新失败，请重试');
    }
  };

  // 待审核
  const pendingWishes = wishes.filter(w => w.status === 'pending');
  // 已通过未兑换
  const approvedWishes = wishes.filter(w => w.status === 'approved' && !w.redeemedAt);
  // 已兑换待确认
  const redeemedWishes = wishes.filter(w => w.redeemedAt && !w.confirmedAt);
  // 已完成
  const completedWishes = wishes.filter(w => w.confirmedAt);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部统计 */}
      <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-purple-500 to-pink-500'} text-white`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">💎 心愿宝藏管理</h2>
            <p className="opacity-90">审核孩子的心愿，设置星星奖励</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{starBalance} ⭐</div>
            <div className="text-sm opacity-90">当前星星余额</div>
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="mt-4 pt-4 border-t border-white/20 flex gap-3 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition flex items-center gap-2"
          >
            <span>✨</span>
            <span>添加心愿</span>
          </button>
          <button
            onClick={() => { setTargetStars(starBalance); setShowAdjustModal(true); }}
            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition flex items-center gap-2"
          >
            <span>⚙️</span>
            <span>手动调整星星</span>
          </button>
        </div>
      </div>

      {/* 待审核心愿 */}
      {pendingWishes.length > 0 && (
        <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            ⏳ 待审核 ({pendingWishes.length})
          </h3>
          
          <div className="space-y-3">
            {pendingWishes.map(wish => (
              <div key={wish.id} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-between flex-wrap gap-3`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{wish.emoji}</span>
                  <div>
                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{wish.name}</h4>
                    <p className="text-sm text-purple-500">建议: {wish.starsRequired || 80} ⭐</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="星星数"
                    defaultValue={wish.starsRequired || 80}
                    className="w-24 px-3 py-2 rounded-lg border text-sm"
                    id={`stars-${wish.id}`}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(`stars-${wish.id}`);
                      handleApprove(wish.id, parseInt(input.value) || 80);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                  >
                    ✓ 通过
                  </button>
                  <button
                    onClick={() => handleReject(wish.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                  >
                    ✕ 拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已通过可兑换 */}
      {approvedWishes.length > 0 && (
        <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            ✅ 已通过 ({approvedWishes.length})
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {approvedWishes.map(wish => (
              <div key={wish.id} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-green-50'} border-2 border-green-300`}>
                <div className="text-center mb-3">
                  <span className="text-4xl">{wish.emoji}</span>
                  <h4 className={`font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{wish.name}</h4>
                </div>
                
                {/* 可编辑星星数 */}
                {editingWish === wish.id ? (
                  <div className="flex items-center gap-2 justify-center mb-3">
                    <input
                      type="number"
                      value={editStars}
                      onChange={(e) => setEditStars(e.target.value)}
                      className="w-20 px-2 py-1 rounded border text-center"
                    />
                    <button
                      onClick={() => handleUpdateWishStars(wish)}
                      className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => { setEditingWish(null); setEditStars(''); }}
                      className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="text-center mb-3">
                    <span className="text-amber-500 font-bold text-lg">{wish.starsRequired} ⭐</span>
                    <button
                      onClick={() => { setEditingWish(wish.id); setEditStars(wish.starsRequired); }}
                      className="ml-2 text-xs text-purple-500 hover:underline"
                    >
                      编辑
                    </button>
                  </div>
                )}
                
                <div className="text-center text-sm text-purple-500">
                  进度: {Math.min(100, Math.round((starBalance / wish.starsRequired) * 100))}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已兑换待确认 */}
      {redeemedWishes.length > 0 && (
        <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🎁 已兑换待确认 ({redeemedWishes.length})
          </h3>
          
          <div className="space-y-3">
            {redeemedWishes.map(wish => (
              <div key={wish.id} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-amber-50'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{wish.emoji}</span>
                  <div>
                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{wish.name}</h4>
                    <p className="text-sm text-purple-500">已花费 {wish.starsRequired} ⭐</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleConfirmRedeem(wish.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                >
                  ✓ 已兑现
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已完成 */}
      {completedWishes.length > 0 && (
        <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🎉 已完成 ({completedWishes.length})
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {completedWishes.slice(0, 10).map(wish => (
              <div key={wish.id} className={`px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center gap-2`}>
                <span className="text-xl">{wish.emoji}</span>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{wish.name}</span>
                <span className="text-green-500">✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {wishes.length === 0 && (
        <div className={`rounded-2xl p-12 ${darkMode ? 'bg-gray-800' : 'bg-white'} text-center`}>
          <div className="text-6xl mb-4">💎</div>
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>还没有心愿</h3>
          <p className="text-purple-500">孩子还没有提交心愿，鼓励Ta去提交吧！</p>
        </div>
      )}

      {/* 手动调整星星弹窗 */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-sm w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              ⚙️ 直接设置星星数
            </h3>
            
            <div className="text-center mb-4">
              <div className="text-sm text-purple-500 mb-2">当前余额: {starBalance} ⭐</div>
            </div>
            
            {/* 加减按钮 + 直接输入 */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => setTargetStars(Math.max(0, targetStars - 5))}
                className={`w-12 h-12 rounded-xl text-2xl font-bold ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                −
              </button>
              
              <div className="flex-1 text-center">
                <input
                  type="number"
                  min="0"
                  value={targetStars}
                  onChange={(e) => setTargetStars(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-32 px-4 py-3 text-center text-3xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  }`}
                />
                <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>⭐</div>
              </div>
              
              <button
                onClick={() => setTargetStars(targetStars + 5)}
                className={`w-12 h-12 rounded-xl text-2xl font-bold ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                +
              </button>
            </div>
            
            {/* 变化提示 */}
            {targetStars !== starBalance && (
              <div className={`text-center text-sm mb-4 ${
                targetStars > starBalance ? 'text-green-500' : 'text-red-500'
              }`}>
                {targetStars > starBalance ? `将增加 ${targetStars - starBalance} ⭐` : `将减少 ${starBalance - targetStars} ⭐`}
              </div>
            )}
            
            {/* 快捷设置按钮 */}
            <div className="flex justify-center gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setTargetStars(0)}
                className={`px-3 py-2 rounded-lg font-medium transition text-sm ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                清零
              </button>
              <button
                onClick={() => setTargetStars(starBalance)}
                className={`px-3 py-2 rounded-lg font-medium transition text-sm ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                不变
              </button>
              <button
                onClick={() => setTargetStars(starBalance + 10)}
                className="px-3 py-2 rounded-lg bg-green-100 text-green-600 font-medium hover:bg-green-200 transition text-sm"
              >
                +10
              </button>
              <button
                onClick={() => setTargetStars(starBalance + 50)}
                className="px-3 py-2 rounded-lg bg-green-100 text-green-600 font-medium hover:bg-green-200 transition text-sm"
              >
                +50
              </button>
              <button
                onClick={() => setTargetStars(starBalance + 100)}
                className="px-3 py-2 rounded-lg bg-green-100 text-green-600 font-medium hover:bg-green-200 transition text-sm"
              >
                +100
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAdjustModal(false); setTargetStars(0); }}
                className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'} hover:opacity-80 transition`}
              >
                取消
              </button>
              <button
                onClick={handleAdjustStars}
                disabled={targetStars === starBalance}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition ${
                  targetStars > starBalance ? 'bg-green-500 hover:bg-green-600' :
                  targetStars < starBalance ? 'bg-red-500 hover:bg-red-600' :
                  'bg-gray-400 cursor-not-allowed'
                }`}
              >
                确认设置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加心愿模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              ✨ 添加心愿
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  心愿名称
                </label>
                <input 
                  type="text"
                  value={newWish.name}
                  onChange={(e) => setNewWish({ ...newWish, name: e.target.value })}
                  placeholder="比如：买乐高、去游乐园..."
                  className={`w-full mt-1 px-4 py-3 rounded-xl ${
                    darkMode 
                      ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600' 
                      : 'bg-gray-100 text-gray-800 placeholder-gray-400 border-gray-200'
                  } border`}
                />
              </div>
              
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  图标
                </label>
                <div className="flex gap-2 mt-2">
                  {['🎁', '🎮', '🧸', '📱', '🎨', '🎢', '🍦', '📚'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setNewWish({ ...newWish, emoji })}
                      className={`text-2xl p-2 rounded-xl transition ${
                        newWish.emoji === emoji
                          ? 'bg-purple-500 text-white'
                          : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  需要星星数
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <button 
                    onClick={() => setNewWish({ ...newWish, starsRequired: Math.max(10, newWish.starsRequired - 10) })}
                    className={`w-10 h-10 rounded-xl font-bold ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    -
                  </button>
                  <span className={`text-2xl font-bold flex-1 text-center ${darkMode ? 'text-purple-400' : 'text-purple-500'}`}>
                    {newWish.starsRequired} ⭐
                  </span>
                  <button 
                    onClick={() => setNewWish({ ...newWish, starsRequired: newWish.starsRequired + 10 })}
                    className={`w-10 h-10 rounded-xl font-bold ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setShowAddModal(false); setNewWish({ name: '', starsRequired: 50, emoji: '🎁' }); }}
                className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
              >
                取消
              </button>
              <button 
                onClick={handleAddWish}
                disabled={!newWish.name.trim()}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  newWish.name.trim()
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                }`}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishManagement;