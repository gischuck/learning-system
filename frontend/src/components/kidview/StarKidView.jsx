import React, { useState, useEffect } from 'react';

const StarKidView = ({ darkMode = false }) => {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [todos, setTodos] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [totalStars, setTotalStars] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState('stars');
  const [showUndoModal, setShowUndoModal] = useState(null);
  const [showHabitModal, setShowHabitModal] = useState(null);
  const [activeTab, setActiveTab] = useState('courses');
  const [habitStatus, setHabitStatus] = useState({ early_sleep: null, early_wake: null, pack_bag: null, play_game: null, watch_tv: null, incomplete_homework: null });
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAddWishModal, setShowAddWishModal] = useState(false);
  const [newWishTitle, setNewWishTitle] = useState('');
  const [newWishStars, setNewWishStars] = useState(20);

  const todayDate = new Date().toISOString().split('T')[0];
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const today = new Date();
  const dayOfWeek = today.getDay();

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
    fetchTodos();
    fetchWishes();
    fetchStarBalance();
    fetchTodayHabits();
  }, []);

  const fetchCourses = async () => {
    try {
      // 1. 学校课表（固定）
      const schoolSchedule = [
        { day: 1, courses: ['数学', '科学', '道德与法治', '班队会', '体育', '信息科技'] },
        { day: 2, courses: ['语文', '数学', '书法', '美术', '艺术欣赏', '跳绳', 'C++ 普及班'] },
        { day: 3, courses: ['数学实践', '语文', '英语', '道德与法治', '体育', '语文'] },
        { day: 4, courses: ['数学', '语文', '体育', '音乐', '京剧', '跳绳'] },
        { day: 5, courses: ['数学', '语文', '体育', '英语', '科学'] },
        { day: 6, courses: [] },
        { day: 0, courses: [] },
      ];
      
      // 2. 从 API 获取课外班
      let extraCourses = [];
      try {
        const response = await fetch('/api/schedules');
        const result = await response.json();
        if (result.success && result.data) {
          extraCourses = result.data.map(s => ({
            id: s.id,
            title: s.title,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            location: s.location || '',
            icon: s.subject === 'math' ? '📐' : s.subject === 'english' ? '📖' : s.subject === 'sports' ? '🏸' : s.subject === 'art' ? '✍️' : '📚',
            color: s.color || '#60A5FA'
          }));
        }
      } catch (e) {
        console.error('获取课外班失败:', e);
      }
      
      // 3. 如果 API 无数据，使用默认
      if (extraCourses.length === 0) {
        extraCourses = [
          { id: 1, title: '高思数学', dayOfWeek: 1, startTime: '18:00', endTime: '20:30', location: '和盛大厦', icon: '📐', color: '#3B82F6' },
          { id: 2, title: '厚海英语', dayOfWeek: 3, startTime: '18:20', endTime: '20:20', location: '新中关', icon: '📖', color: '#10B981' },
          { id: 3, title: '优才数学', dayOfWeek: 5, startTime: '17:30', endTime: '20:30', location: '知春大厦', icon: '📐', color: '#3B82F6' },
          { id: 4, title: '羽毛球', dayOfWeek: 0, startTime: '10:30', endTime: '12:00', location: '体育中心', icon: '🏸', color: '#F59E0B' },
          { id: 5, title: '习墨写字', dayOfWeek: 0, startTime: '17:20', endTime: '18:50', location: '书法教室', icon: '✍️', color: '#8B5CF6' },
        ];
      }
      
      setCourses(extraCourses);
      
      // 4. 保存学校课表到状态
      window.schoolScheduleData = schoolSchedule;
    } catch (error) { 
      console.error('获取课程失败:', error); 
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/assignments');
      const result = await response.json();
      if (result.success) {
        const assignmentsWithStars = (result.data || []).map(a => ({
          ...a,
          calculatedStars: a.starReward || calculateStars(a)
        }));
        setAssignments(assignmentsWithStars);
      }
    } catch (error) { console.error('获取作业失败:', error); }
  };

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      const result = await response.json();
      if (result.success) {
        const todosWithStars = (result.data || []).map(t => ({
          ...t,
          calculatedStars: t.points || 2
        }));
        setTodos(todosWithStars);
      }
    } catch (error) { console.error('获取待办失败:', error); }
  };

  const fetchWishes = async () => {
    try {
      const response = await fetch('/api/wishes');
      const result = await response.json();
      if (result.success) { setWishes(result.data || []); }
    } catch (error) { console.error('获取心愿失败:', error); }
  };

  const fetchStarBalance = async () => {
    try {
      const response = await fetch('/api/stars/balance');
      const result = await response.json();
      if (result.success) { setTotalStars(result.data.balance); }
    } catch (error) { console.error('获取星星余额失败:', error); }
  };

  const fetchTodayHabits = async () => {
    try {
      const response = await fetch('/api/habits/today');
      const result = await response.json();
      if (result.success) { setHabitStatus(result.data.status); }
    } catch (error) { console.error('获取习惯状态失败:', error); }
  };

  const calculateStars = (item) => {
    const title = item.title || '';
    if (['高思数学', '厚海英语', '优才数学', '习墨写字', 'C++'].some(s => title.includes(s))) return 5;
    if (['PET', 'GESP', '竞赛', '考试', '备考'].some(s => title.includes(s))) return 20;
    if (['家务', '整理', '洗碗', '做饭'].some(s => title.includes(s))) return 5;
    if (['数学', '语文', '英语'].includes(item.subject)) return 3;
    return 2;
  };

  const getLevelInfo = (stars) => {
    // 一年约获得4000-5000星星，30级需要一年左右
    const levels = [
      { level: 1, name: '星光萌芽', stars: 0, icon: '🔵', color: '#60A5FA' },
      { level: 2, name: '星辉初现', stars: 20, icon: '🔵', color: '#60A5FA' },
      { level: 3, name: '星芒渐显', stars: 50, icon: '🔵', color: '#60A5FA' },
      { level: 4, name: '星河初探', stars: 90, icon: '🔵', color: '#60A5FA' },
      { level: 5, name: '星辉渐浓', stars: 140, icon: '🔵', color: '#60A5FA' },
      { level: 6, name: '星耀新星', stars: 200, icon: '🟢', color: '#34D399' },
      { level: 7, name: '星河漫游', stars: 270, icon: '🟢', color: '#34D399' },
      { level: 8, name: '星芒璀璨', stars: 350, icon: '🟢', color: '#34D399' },
      { level: 9, name: '星耀天际', stars: 450, icon: '🟢', color: '#34D399' },
      { level: 10, name: '星河主宰', stars: 560, icon: '🟢', color: '#34D399' },
      { level: 11, name: '星辰守望', stars: 680, icon: '🟡', color: '#FCD34D' },
      { level: 12, name: '星耀传奇', stars: 820, icon: '🟡', color: '#FCD34D' },
      { level: 13, name: '星河霸主', stars: 970, icon: '🟡', color: '#FCD34D' },
      { level: 14, name: '星芒神尊', stars: 1140, icon: '🟡', color: '#FCD34D' },
      { level: 15, name: '星辰大帝', stars: 1330, icon: '🟡', color: '#FCD34D' },
      { level: 16, name: '星河王者', stars: 1550, icon: '🟠', color: '#FB923C' },
      { level: 17, name: '星耀至尊', stars: 1800, icon: '🟠', color: '#FB923C' },
      { level: 18, name: '星河传说', stars: 2100, icon: '🟠', color: '#FB923C' },
      { level: 19, name: '星芒神话', stars: 2500, icon: '🟠', color: '#FB923C' },
      { level: 20, name: '星辰天神', stars: 3000, icon: '🟠', color: '#FB923C' },
      { level: 21, name: '星河守护者', stars: 3600, icon: '🔴', color: '#F87171' },
      { level: 22, name: '星耀圣尊', stars: 4300, icon: '🔴', color: '#F87171' },
      { level: 23, name: '星河主宰者', stars: 5000, icon: '🔴', color: '#F87171' },
      { level: 24, name: '星芒创造者', stars: 5800, icon: '🔴', color: '#F87171' },
      { level: 25, name: '星辰统治者', stars: 6700, icon: '🔴', color: '#F87171' },
      { level: 26, name: '星河神王', stars: 7700, icon: '🟣', color: '#A78BFA' },
      { level: 27, name: '星耀至尊王', stars: 8800, icon: '🟣', color: '#A78BFA' },
      { level: 28, name: '星河主宰神', stars: 10000, icon: '🟣', color: '#A78BFA' },
      { level: 29, name: '星芒创世神', stars: 12000, icon: '🟣', color: '#A78BFA' },
      { level: 30, name: '星辰永恒神', stars: 15000, icon: '🟣', color: '#A78BFA' }
    ];
    
    let currentLevel = levels[0];
    for (let i = levels.length - 1; i >= 0; i--) {
      if (stars >= levels[i].stars) {
        currentLevel = levels[i];
        break;
      }
    }
    
    const nextLevel = levels.find(l => l.level === currentLevel.level + 1);
    const progress = nextLevel 
      ? ((stars - currentLevel.stars) / (nextLevel.stars - currentLevel.stars)) * 100 
      : 100;

    return { ...currentLevel, progress, nextLevel };
  };

  const levelInfo = getLevelInfo(totalStars);

  const triggerCelebration = (type = 'stars') => {
    setCelebrationType(type);
    setShowCelebration(true);
    setIsAnimating(true);
    setTimeout(() => {
      setShowCelebration(false);
      setIsAnimating(false);
    }, 2000);
  };

  const toggleAssignment = async (assignment) => {
    if (assignment.status === 'completed') return;
    
    try {
      // 使用 /complete 接口，孩子看板无需登录
      const response = await fetch(`/api/assignments/${assignment.id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          approvalStatus: 'pending'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        triggerCelebration('submitted');
        fetchAssignments();
        window.dispatchEvent(new CustomEvent('notificationUpdate'));
      } else {
        console.error('提交作业失败:', result.message);
      }
    } catch (error) { console.error('提交作业失败:', error); }
  };

  const toggleTodo = async (todo) => {
    if (todo.status === 'completed') return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          status: 'completed',
          approvalStatus: 'pending'
        })
      });
      
      triggerCelebration('submitted');
      fetchTodos();
    } catch (error) { console.error('提交待办失败:', error); }
  };

  const undoTodo = async (todo) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          status: 'active',
          approvalStatus: null
        })
      });
      
      fetchTodos();
    } catch (error) { console.error('撤销待办失败:', error); }
  };

  const undoAssignment = async (assignment) => {
    if (assignment.approvalStatus !== 'approved') {
      try {
        const token = localStorage.getItem('token');
        await fetch(`/api/assignments/${assignment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ status: 'active', approvalStatus: null })
        });
        fetchAssignments();
        setShowUndoModal(null);
      } catch (error) { console.error('取消失败:', error); }
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/assignments/${assignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'active', approvalStatus: null })
      });
      
      const stars = assignment.calculatedStars || 5;
      await fetch('/api/stars/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: -stars, description: `撤销作业：${assignment.title}` })
      });
      
      fetchAssignments();
      fetchStarBalance();
      setShowUndoModal(null);
    } catch (error) { console.error('撤销失败:', error); }
  };

  // 撤销待审核的作业（不需要扣星星）
  const undoAssignmentPending = async (assignment) => {
    try {
      const response = await fetch(`/api/assignments/${assignment.id}/undo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (result.success) {
        fetchAssignments();
      } else {
        console.error('撤销失败:', result.message);
      }
    } catch (error) { console.error('撤销失败:', error); }
  };

  const checkHabit = async (habitType, completed) => {
    try {
      const token = localStorage.getItem('token');
      const currentStatus = habitStatus[habitType];
      
      // 构建请求体：如果已打卡则撤销，否则打卡
      const body = currentStatus 
        ? { habitType, date: todayDate } // 撤销时不需要status
        : { habitType, status: completed ? 'completed' : 'failed', date: todayDate };
      
      const response = await fetch('/api/habits/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      
      const result = await response.json();
      if (result.success) {
        // 后端返回的状态（如果是撤销，status为null）
        const newStatus = result.data.status;
        setHabitStatus(prev => ({ ...prev, [habitType]: newStatus }));
        fetchStarBalance();
        
        // 撤销不触发庆祝动画
        if (!currentStatus) {
          triggerCelebration(completed ? 'success' : 'oops');
        }
      }
    } catch (error) { console.error('打卡失败:', error); }
  };

  const unlockWish = async (wish) => {
    if (totalStars >= wish.starsRequired) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/wishes/${wish.id}/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          triggerCelebration('wish');
          fetchWishes();
          fetchStarBalance();
        }
      } catch (error) { console.error('兑换失败:', error); }
    }
  };

  const submitWish = async () => {
    if (!newWishTitle.trim() || newWishStars <= 0) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: newWishTitle.trim(),
          starsRequired: newWishStars,
          icon: '🎁',
          status: 'pending'
        })
      });
      const result = await response.json();
      if (result.success) {
        setShowAddWishModal(false);
        setNewWishTitle('');
        setNewWishStars(20);
        fetchWishes();
      }
    } catch (error) { console.error('提交心愿失败:', error); }
  };

  const approvedWishes = wishes.filter(w => w.status === 'approved');
  const pendingWishes = wishes.filter(w => w.status === 'pending');

  const getCardSize = (stars) => {
    if (stars >= 15) return 'large';
    if (stars >= 5) return 'medium';
    return 'small';
  };

  const renderApprovalBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-700 text-xs font-medium">⏳ 待审核</span>;
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-700 text-xs font-medium">✓ 已通过</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100/80 text-red-600 text-xs font-medium">✗ 已拒绝</span>;
      default:
        return null;
    }
  };

  // 今日课程
  const todayCourses = courses.filter(c => c.dayOfWeek === dayOfWeek);

  return (
    <div className="min-h-screen pb-8" style={{
      background: darkMode 
        ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)'
        : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 30%, #fcd34d 60%, #f59e0b 100%)'
    }}>
      {/* 庆祝动画 - 更自然 */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          <div className={`text-6xl transform transition-all duration-500 ${
            isAnimating ? 'scale-150 opacity-100' : 'scale-50 opacity-0'
          }`}>
            {celebrationType === 'stars' && '🎉'}
            {celebrationType === 'submitted' && '📤'}
            {celebrationType === 'success' && '✨'}
            {celebrationType === 'oops' && '😅'}
            {celebrationType === 'wish' && '🎁'}
          </div>
          {/* 星星飘落效果 */}
          {celebrationType === 'success' && (
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute animate-bounce text-2xl"
                  style={{
                    left: `${20 + i * 10}%`,
                    top: `${10 + (i % 3) * 20}%`,
                    animationDelay: `${i * 100}ms`,
                    animationDuration: '1s'
                  }}
                >
                  ⭐
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 撤销确认弹窗 */}
      {showUndoModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 max-w-sm w-full shadow-xl transform transition-all`}>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-2`}>
              {showUndoModal.approvalStatus === 'approved' ? '确认撤销？' : '取消提交'}
            </h2>
            {showUndoModal.approvalStatus === 'approved' ? (
              <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} mb-4`}>
                撤销后将扣除 {showUndoModal.calculatedStars} 星星
              </p>
            ) : (
              <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} mb-4`}>
                取消提交，不会扣星星
              </p>
            )}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowUndoModal(null)} 
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                  darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                取消
              </button>
              <button 
                onClick={() => undoAssignment(showUndoModal)} 
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                  showUndoModal.approvalStatus === 'approved'
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-amber-500 text-white hover:bg-amber-600'
                }`}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 习惯打卡选择弹窗 */}
      {showHabitModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 max-w-sm w-full shadow-xl transform transition-all`}>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-2 text-center`}>
              {showHabitModal.icon} {showHabitModal.name}
            </h2>
            <p className={`text-center mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              今天完成了吗？
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  checkHabit(showHabitModal.key, false);
                  setShowHabitModal(null);
                }} 
                className="flex-1 py-3 rounded-xl font-medium transition-all bg-rose-500 text-white hover:bg-rose-600"
              >
                ❌ 未完成
                <div className="text-xs opacity-80">{showHabitModal.penalty}⭐</div>
              </button>
              <button 
                onClick={() => {
                  checkHabit(showHabitModal.key, true);
                  setShowHabitModal(null);
                }} 
                className="flex-1 py-3 rounded-xl font-medium transition-all bg-emerald-500 text-white hover:bg-emerald-600"
              >
                ✅ 完成
                <div className="text-xs opacity-80">+{showHabitModal.reward}⭐</div>
              </button>
            </div>
            <button 
              onClick={() => setShowHabitModal(null)} 
              className={`w-full mt-3 py-2 rounded-xl text-sm ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-600'}`}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 头部等级显示 - 更精致 */}
      <div className="text-center pt-6 pb-4 px-4">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 shadow-lg ${
          darkMode ? 'bg-slate-800' : 'bg-white/80'
        }`} style={{ boxShadow: `0 4px 20px ${levelInfo.color}40` }}>
          <span className="text-3xl">{levelInfo.icon}</span>
        </div>
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} tracking-tight`}>
          Lv.{levelInfo.level} {levelInfo.name}
        </h1>
        
        {/* 进度条 - 更优雅 */}
        <div className="mt-3 max-w-xs mx-auto">
          <div className={`h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-white/50'}`}>
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${levelInfo.progress}%`,
                background: `linear-gradient(90deg, ${levelInfo.color}, ${levelInfo.color}dd)`
              }}
            />
          </div>
          <div className={`text-sm mt-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="font-medium">{totalStars}</span>
            <span className="mx-1">/</span>
            <span>{levelInfo.nextLevel?.stars || 'MAX'}</span>
            <span className="ml-1">⭐</span>
          </div>
        </div>
      </div>

      {/* 习惯打卡 - 更圆润 */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-3 gap-2">
          {(() => {
            // 从 localStorage 读取习惯设置
            const savedRules = localStorage.getItem('habitRules');
            const defaultRules = [
              { key: 'early_sleep', name: '早睡', time: '21:30', icon: '🌙', reward: 6, penalty: 8, type: 'positive' },
              { key: 'early_wake', name: '早起', time: '7:00', icon: '☀️', reward: 8, penalty: 10, type: 'positive' },
              { key: 'pack_bag', name: '书包', time: '睡前', icon: '🎒', reward: 2, penalty: 3, type: 'positive' },
              { key: 'play_game', name: '玩游戏', icon: '🎮', penalty: 10, type: 'negative' },
              { key: 'watch_tv', name: '看电视', icon: '📺', penalty: 5, type: 'negative' },
              { key: 'incomplete_homework', name: '漏作业', icon: '📝', penalty: 10, type: 'negative' }
            ];
            
            let habits = defaultRules;
            
            return habits.map(habit => {
              const status = habitStatus[habit.key];
              const isNegative = habit.type === 'negative';
              
              return (
                <button 
                  key={habit.key}
                  onClick={() => {
                    if (isNegative) {
                      if (!status) {
                        checkHabit(habit.key, false);
                      } else {
                        checkHabit(habit.key, true);
                      }
                    } else {
                      if (!status) {
                        setShowHabitModal(habit);
                      } else {
                        checkHabit(habit.key, status === 'completed');
                      }
                    }
                  }}
                  className={`relative p-3 rounded-2xl transition-all duration-300 active:scale-95 ${
                    status === 'completed'
                      ? darkMode
                        ? 'bg-emerald-500/20 border-2 border-emerald-400'
                        : 'bg-emerald-100 border-2 border-emerald-400'
                      : status === 'failed'
                        ? darkMode
                          ? 'bg-rose-500/20 border-2 border-rose-400'
                          : 'bg-rose-100 border-2 border-rose-400'
                        : isNegative
                          ? darkMode
                            ? 'bg-slate-800/40 border-2 border-slate-600 hover:border-rose-400'
                            : 'bg-white/40 border-2 border-slate-200 hover:border-rose-400'
                          : darkMode
                            ? 'bg-slate-800/50 border-2 border-slate-600 hover:border-slate-400'
                            : 'bg-white/60 border-2 border-amber-200 hover:border-amber-400'
                  }`}
                >
                  <div className="text-2xl mb-1">{habit.icon}</div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {habit.name}
                  </div>
                  <div className={`text-xs ${
                    status === 'completed' 
                      ? (darkMode ? 'text-emerald-300' : 'text-emerald-600')
                      : status === 'failed'
                        ? (darkMode ? 'text-rose-300' : 'text-rose-600')
                        : (darkMode ? 'text-slate-400' : 'text-slate-500')
                  }`}>
                    {status ? '点此撤销' : isNegative ? `${habit.penalty}⭐/次` : habit.time}
                  </div>
                  <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    status === 'completed' 
                      ? 'bg-emerald-500 text-white'
                      : status === 'failed'
                        ? 'bg-rose-500 text-white'
                        : 'hidden'
                  }`}>
                    {status === 'completed' ? '✓' : '✗'}
                  </div>
                </button>
              );
            });
          })()}
        </div>
        <div className={`text-xs text-center mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          点击打卡，再次点击撤销
        </div>
      </div>

      {/* Tab 切换 - 更现代 */}
      <div className="px-4 mb-4">
        <div className={`flex rounded-2xl p-1.5 gap-1 ${darkMode ? 'bg-slate-800/60' : 'bg-white/60'}`}>
          {[
            { key: 'courses', label: '课程', icon: '📚' },
            { key: 'assignments', label: '作业', icon: '✏️' },
            { key: 'todos', label: '待办', icon: '📋' },
            { key: 'wishes', label: '心愿', icon: '🎁' }
          ].map(tab => (
            <button 
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === tab.key
                  ? darkMode
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-amber-500 text-white shadow-lg'
                  : darkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 课程表 Tab */}
      {activeTab === 'courses' && (
        <div className="px-4 space-y-3">
          {/* 学校课表 - 一周 */}
          <div className={`rounded-xl p-4 ${darkMode ? 'bg-slate-800/60' : 'bg-white/80'}`}>
            <h4 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              🏫 学校课程表
            </h4>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(day => {
                const schoolSchedule = window.schoolScheduleData || [];
                const dayData = schoolSchedule.find(s => s.day === day);
                const courses = dayData?.courses || [];
                const isToday = day === dayOfWeek;
                
                return (
                  <div key={day} className={`p-2 rounded-lg ${isToday ? 'ring-2 ring-amber-400' : ''} ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium text-sm ${isToday ? 'text-amber-500' : darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {weekDays[day]}
                      </span>
                      {isToday && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">今天</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {courses.length > 0 ? courses.map((course, idx) => (
                        <span key={idx} className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-slate-600 text-slate-200' : 'bg-white text-slate-600'}`}>
                          {course}
                        </span>
                      )) : (
                        <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>无课程</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 今日课外班 */}
          <div className={`rounded-xl p-4 ${darkMode ? 'bg-slate-800/60' : 'bg-white/80'}`}>
            <h4 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              📚 今日课外班
            </h4>
            {todayCourses.length > 0 ? (
              <div className="space-y-2">
                {todayCourses.map(course => (
                  <div 
                    key={course.id}
                    className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}
                    style={{ borderLeft: `4px solid ${course.color || '#60A5FA'}` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{course.icon || '📖'}</span>
                      <div className="flex-1">
                        <div className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {course.title || course.name}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {course.startTime} {course.endTime && `- ${course.endTime}`}
                          {course.location && ` · ${course.location}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-4 rounded-lg ${darkMode ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                <span className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  今天没有课外班
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 作业任务 Tab */}
      {activeTab === 'assignments' && (
        <div className="px-4 space-y-2">
          {assignments.length > 0 ? assignments.map(assignment => {
            const isCompleted = assignment.status === 'completed';
            // 只有已完成且待审核才是pending状态
            const isPending = isCompleted && assignment.approvalStatus === 'pending';
            const isApproved = assignment.approvalStatus === 'approved';
            const isRejected = assignment.approvalStatus === 'rejected';
            
            // 每周作业：检查本周是否已审核通过
            const isWeeklyApproved = assignment.recurringType === 'weekly' && isApproved;
            const approvedDate = assignment.approvedAt ? new Date(assignment.approvedAt) : null;
            const isApprovedThisWeek = isWeeklyApproved && approvedDate && 
              (new Date() - approvedDate) < 7 * 24 * 60 * 60 * 1000;
            
            // 每日作业：检查今天是否已审核通过
            const approvedToday = assignment.recurringType === 'daily' && isApproved && approvedDate &&
              approvedDate.toDateString() === new Date().toDateString();

            return (
              <div 
                key={assignment.id}
                className={`p-4 rounded-2xl transition-all duration-300 ${
                  isPending
                    ? darkMode
                      ? 'bg-amber-900/20 border border-amber-700/50'
                      : 'bg-amber-50/60 border border-amber-200'
                    : isApprovedThisWeek || approvedToday
                      ? darkMode
                        ? 'bg-emerald-900/30 border border-emerald-700'
                        : 'bg-emerald-50 border border-emerald-200'
                      : isApproved
                        ? darkMode
                          ? 'bg-emerald-900/30 border border-emerald-700'
                          : 'bg-emerald-50 border border-emerald-200'
                        : isRejected
                          ? darkMode
                            ? 'bg-rose-900/20 border border-rose-700/50'
                            : 'bg-rose-50 border border-rose-200'
                          : getCardSize(assignment.calculatedStars) === 'large'
                            ? darkMode
                              ? 'bg-slate-800/60 border border-slate-600'
                              : 'bg-white/80 border border-amber-200'
                            : darkMode
                              ? 'bg-slate-800/40 border border-slate-700'
                              : 'bg-white/60 border border-slate-200'
                } ${isRejected ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium truncate ${
                        isApprovedThisWeek || approvedToday || isApproved
                          ? `${darkMode ? 'text-emerald-300 line-through' : 'text-emerald-600 line-through'}`
                          : isRejected
                            ? `${darkMode ? 'text-rose-300/70' : 'text-rose-600/70'}`
                            : `${darkMode ? 'text-white' : 'text-slate-800'}`
                      }`}>
                        {assignment.title}
                      </span>
                      {isPending && <span className={`ml-2 text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-amber-600/30 text-amber-300' : 'bg-amber-100 text-amber-600'}`}>待审核</span>}
                      {(isApprovedThisWeek || approvedToday || isApproved) && renderApprovalBadge(assignment.approvalStatus)}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isPending 
                        ? `${darkMode ? 'text-amber-400/50' : 'text-amber-500/60'}`
                        : isApprovedThisWeek || approvedToday || isApproved
                          ? `${darkMode ? 'text-emerald-400/50' : 'text-emerald-500/60'}`
                          : `${darkMode ? 'text-slate-400' : 'text-slate-500'}`
                    }`}>
                      {assignment.subject} · ⭐ {assignment.calculatedStars}
                      {assignment.recurringType === 'weekly' && ' · 每周'}
                      {assignment.recurringType === 'daily' && ' · 每日'}
                    </div>
                  </div>
                  
                  {/* 未完成 且 不是本周已通过的周作业 */}
                  {!isCompleted && !isApprovedThisWeek && !approvedToday ? (
                    <button 
                      onClick={() => toggleAssignment(assignment)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all active:scale-95 ${
                        darkMode
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                          : 'bg-amber-500 text-white hover:bg-amber-400'
                      }`}
                    >
                      完成
                    </button>
                  ) : isPending ? (
                    <button 
                      onClick={() => undoAssignmentPending(assignment)}
                      className={`px-3 py-2 rounded-xl text-sm transition-all active:scale-95 ${
                        darkMode
                          ? 'bg-rose-600/30 text-rose-300 hover:bg-rose-600/50'
                          : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                      }`}
                    >
                      撤销
                    </button>
                  ) : (isApprovedThisWeek || approvedToday) ? (
                    <span className={`px-3 py-2 rounded-xl text-sm font-medium ${
                      darkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      本周已完成 +{assignment.calculatedStars}⭐
                    </span>
                  ) : isApproved ? (
                    <span className={`px-3 py-2 rounded-xl text-sm font-medium ${
                      darkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      已完成 +{assignment.calculatedStars}⭐
                    </span>
                  ) : isRejected ? (
                    <button 
                      onClick={() => toggleAssignment(assignment)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all active:scale-95 ${
                        darkMode
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                          : 'bg-amber-500 text-white hover:bg-amber-400'
                      }`}
                    >
                      重做
                    </button>
                  ) : null}
                </div>
              </div>
            );
          }) : (
            <div className={`text-center py-8 rounded-2xl ${darkMode ? 'bg-slate-800/40' : 'bg-white/40'}`}>
              <div className="text-4xl mb-2">📝</div>
              <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                暂无作业任务
              </p>
            </div>
          )}
        </div>
      )}

      {/* 近期待办 Tab */}
      {activeTab === 'todos' && (
        <div className="px-4 space-y-2">
          {todos.filter(t => t.showOnKidBoard !== false && (t.status !== 'completed' || t.approvalStatus === 'pending') && t.approvalStatus !== 'approved').length > 0 ? todos.filter(t => t.showOnKidBoard !== false && (t.status !== 'completed' || t.approvalStatus === 'pending') && t.approvalStatus !== 'approved').map(todo => {
            const isCompleted = todo.status === 'completed';
            const isApproved = todo.approvalStatus === 'approved';
            const isPending = todo.approvalStatus === 'pending';
            const isRejected = todo.approvalStatus === 'rejected';

            return (
              <div 
                key={todo.id}
                className={`p-4 rounded-2xl transition-all duration-300 ${
                  isPending
                    ? darkMode
                      ? 'bg-amber-900/20 border border-amber-700/50'
                      : 'bg-amber-50/60 border border-amber-200'
                    : isCompleted
                      ? darkMode
                        ? 'bg-emerald-900/30 border border-emerald-700'
                        : 'bg-emerald-50 border border-emerald-200'
                      : darkMode
                        ? 'bg-slate-800/40 border border-slate-700'
                        : 'bg-white/60 border border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium truncate ${
                        isCompleted
                          ? `${darkMode ? 'text-emerald-300 line-through' : 'text-emerald-600 line-through'}`
                          : `${darkMode ? 'text-white' : 'text-slate-800'}`
                      }`}>
                        {todo.title}
                      </span>
                      {isPending && <span className={`ml-2 text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-amber-600/30 text-amber-300' : 'bg-amber-100 text-amber-600'}`}>待审核</span>}
                      {isCompleted && isApproved && renderApprovalBadge(todo.approvalStatus)}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isPending 
                        ? `${darkMode ? 'text-amber-400/50' : 'text-amber-500/60'}`
                        : `${darkMode ? 'text-slate-400' : 'text-slate-500'}`
                    }`}>
                      {todo.dueDate && new Date(todo.dueDate).toLocaleDateString()} · ⭐ {todo.calculatedStars}
                    </div>
                  </div>
                  
                  {!isCompleted && !isPending ? (
                    <button 
                      onClick={() => toggleTodo(todo)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all active:scale-95 ${
                        darkMode
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                          : 'bg-amber-500 text-white hover:bg-amber-400'
                      }`}
                    >
                      完成
                    </button>
                  ) : isPending ? (
                    <button 
                      onClick={() => undoTodo(todo)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                        darkMode
                          ? 'bg-rose-600/30 text-rose-300 hover:bg-rose-600/50'
                          : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                      }`}
                    >
                      撤销
                    </button>
                  ) : null}
                </div>
              </div>
            );
          }) : (
            <div className={`text-center py-8 rounded-2xl ${darkMode ? 'bg-slate-800/40' : 'bg-white/40'}`}>
              <div className="text-4xl mb-2">📋</div>
              <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                暂无待办任务
              </p>
            </div>
          )}
        </div>
      )}

      {/* 心愿宝藏 Tab */}
      {activeTab === 'wishes' && (
        <div className="px-4 space-y-4">
          {/* 提交心愿按钮 */}
          <button 
            onClick={() => setShowAddWishModal(true)}
            className={`w-full py-3 rounded-xl font-medium transition-all active:scale-98 ${
              darkMode
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400'
            }`}
          >
            ✨ 我想要...
          </button>

          {/* 可兑换心愿 */}
          {approvedWishes.length > 0 && (
            <div>
              <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                ✨ 可兑换心愿
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {approvedWishes.map(wish => {
                  const canRedeem = totalStars >= wish.starsRequired;
                  const wishName = wish.title || wish.name;
                  const wishIcon = wish.icon || wish.emoji || '🎁';
                  return (
                    <div 
                      key={wish.id}
                      className={`p-4 rounded-2xl transition-all ${
                        canRedeem
                          ? darkMode
                            ? 'bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-2 border-amber-500'
                            : 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400'
                          : darkMode
                            ? 'bg-slate-800/40 border border-slate-600'
                            : 'bg-white/60 border border-slate-200'
                      }`}
                    >
                      <div className="text-2xl mb-2">{wishIcon}</div>
                      <div className={`font-medium text-sm truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {wishName}
                      </div>
                      <div className={`text-xs mt-1 ${canRedeem ? 'text-amber-400' : darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {wish.starsRequired} ⭐
                      </div>
                      
                      {canRedeem ? (
                        <button 
                          onClick={() => unlockWish(wish)}
                          className={`w-full mt-3 py-2 rounded-xl font-medium transition-all active:scale-95 ${
                            darkMode
                              ? 'bg-amber-500 text-white hover:bg-amber-400'
                              : 'bg-amber-500 text-white hover:bg-amber-400'
                          }`}
                        >
                          兑换
                        </button>
                      ) : (
                        <div className={`text-xs mt-3 text-center ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          还差 {wish.starsRequired - totalStars} ⭐
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 待审核心愿 */}
          {pendingWishes.length > 0 && (
            <div>
              <h4 className={`font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                ⏳ 等待家长审核
              </h4>
              <div className="space-y-2">
                {pendingWishes.map(wish => {
                  const wishName = wish.title || wish.name;
                  const wishIcon = wish.icon || wish.emoji || '🎁';
                  return (
                    <div 
                      key={wish.id}
                      className={`p-3 rounded-xl flex items-center gap-3 ${
                        darkMode ? 'bg-slate-800/40' : 'bg-white/40'
                      }`}
                    >
                      <span className="text-xl">{wishIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm truncate ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {wishName}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {wish.starsRequired} ⭐
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg ${
                        darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'
                      }`}>
                        待审核
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 无心愿 */}
          {approvedWishes.length === 0 && pendingWishes.length === 0 && (
            <div className={`text-center py-8 rounded-2xl ${darkMode ? 'bg-slate-800/40' : 'bg-white/40'}`}>
              <div className="text-4xl mb-2">🎁</div>
              <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                点击上方按钮，许下你的心愿吧！
              </p>
            </div>
          )}
        </div>
      )}

      {/* 提交心愿弹窗 */}
      {showAddWishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm rounded-2xl p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              ✨ 许下心愿
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  心愿名称
                </label>
                <input 
                  type="text"
                  value={newWishTitle}
                  onChange={(e) => setNewWishTitle(e.target.value)}
                  placeholder="我想要..."
                  className={`w-full mt-1 px-4 py-3 rounded-xl ${
                    darkMode 
                      ? 'bg-slate-700 text-white placeholder-slate-400' 
                      : 'bg-slate-100 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>
              
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  需要多少星星？
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <button 
                    onClick={() => setNewWishStars(Math.max(5, newWishStars - 5))}
                    className={`w-10 h-10 rounded-xl font-bold ${darkMode ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}
                  >
                    -
                  </button>
                  <span className={`text-2xl font-bold flex-1 text-center ${darkMode ? 'text-amber-400' : 'text-amber-500'}`}>
                    {newWishStars} ⭐
                  </span>
                  <button 
                    onClick={() => setNewWishStars(newWishStars + 5)}
                    className={`w-10 h-10 rounded-xl font-bold ${darkMode ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setShowAddWishModal(false); setNewWishTitle(''); setNewWishStars(20); }}
                className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}
              >
                取消
              </button>
              <button 
                onClick={submitWish}
                disabled={!newWishTitle.trim()}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  newWishTitle.trim()
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : darkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-200 text-slate-400'
                }`}
              >
                提交给家长
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StarKidView;