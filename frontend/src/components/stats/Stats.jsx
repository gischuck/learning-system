import React, { useState, useEffect } from 'react';

// 学校课表默认数据（从 API 获取或使用默认）
const defaultSchoolSchedule = [
  { day: 1, courses: ['数学', '科学', '道德与法治', '班队会', '体育', '信息科技'] },
  { day: 2, courses: ['语文', '数学', '书法', '美术', '艺术欣赏', '跳绳', 'C++ 普及班'] },
  { day: 3, courses: ['数学实践', '语文', '英语', '道德与法治', '体育', '语文'] },
  { day: 4, courses: ['数学', '语文', '体育', '音乐', '京剧', '跳绳'] },
  { day: 5, courses: ['数学', '语文', '体育', '英语', '科学'] },
  { day: 6, courses: [] },
  { day: 0, courses: [] },
];

// 课程名称到学科的映射
const courseSubjectMap = {
  '数学': 'math',
  '数学实践': 'math',
  '语文': 'chinese',
  '英语': 'english',
  '科学': 'science',
  '信息科技': 'science',
  '体育': 'sports',
  '跳绳': 'sports',
  '美术': 'art',
  '书法': 'art',
  '艺术欣赏': 'art',
  '音乐': 'art',
  '京剧': 'art',
  '道德与法治': 'other',
  '班队会': 'other',
  'C++ 普及班': 'math',
};

// 科目到英文代码的映射（支持中英文）
const subjectNameToCode = {
  '数学': 'math',
  '语文': 'chinese',
  '英语': 'english',
  '科学': 'science',
  '体育': 'sports',
  '艺术': 'art',
  '美术': 'art',
  '音乐': 'art',
  '其他': 'other',
  // 英文代码直接返回
  'math': 'math',
  'chinese': 'chinese',
  'english': 'english',
  'science': 'science',
  'sports': 'sports',
  'art': 'art',
  'other': 'other',
};

// 每节课时长（小时）
const CLASS_DURATION = 40 / 60; // 40分钟

const Stats = ({ darkMode = false }) => {
  const [stats, setStats] = useState({
    plans: [],
    todos: [],
    schedules: [],
    assignments: []
  });
  const [courseType, setCourseType] = useState('extracurricular'); // 'school' | 'extracurricular'
  const [schoolSchedule, setSchoolSchedule] = useState(defaultSchoolSchedule);
  // 课外班数据从 API 获取
  const [extracurricularCourses, setExtracurricularCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  // 从 API 获取所有数据
  const fetchStats = async () => {
    setLoading(true);
    try {
      const [plansRes, todosRes, schedulesRes, assignmentsRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/todos'),
        fetch('/api/schedules'),
        fetch('/api/assignments')
      ]);

      const plansData = await plansRes.json();
      const todosData = await todosRes.json();
      const schedulesData = await schedulesRes.json();
      const assignmentsData = await assignmentsRes.json();

      // 使用 API 返回的课程表数据
      const apiSchedules = schedulesData.success ? schedulesData.data : [];
      
      setStats({
        plans: plansData.success ? plansData.data : [],
        todos: todosData.success ? todosData.data : [],
        schedules: apiSchedules,
        assignments: assignmentsData.success ? assignmentsData.data : []
      });

      // 使用 API 数据
      setExtracurricularCourses(apiSchedules);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const { plans, todos, schedules, assignments } = stats;

  // 计算课内各科时长
  const calculateSchoolHours = () => {
    const subjectHours = {
      math: 0,
      english: 0,
      chinese: 0,
      sports: 0,
      art: 0,
      science: 0,
      other: 0
    };

    schoolSchedule.forEach(day => {
      day.courses.forEach(courseName => {
        const subject = courseSubjectMap[courseName] || 'other';
        subjectHours[subject] += CLASS_DURATION;
      });
    });

    return subjectHours;
  };

  // 计算课外各科时长
  const calculateExtracurricularHours = () => {
    const subjectHours = {
      math: 0,
      english: 0,
      chinese: 0,
      sports: 0,
      art: 0,
      science: 0,
      other: 0
    };

    extracurricularCourses.forEach(s => {
      // 将中文科目名转换为英文代码
      // API 返回的字段可能是 subject 或 title
      const subjectCode = subjectNameToCode[s.subject] || 
                          subjectNameToCode[s.title] || 
                          'other';
      
      // API 返回的时间字段可能是 startTime/endTime 或 start_time/end_time
      const startTime = s.startTime || s.start_time;
      const endTime = s.endTime || s.end_time;
      
      const duration = calculateDuration(startTime, endTime);
      subjectHours[subjectCode] = (subjectHours[subjectCode] || 0) + duration;
    });

    return subjectHours;
  };

  // 根据切换选择计算
  const subjectStats = courseType === 'school' ? calculateSchoolHours() : calculateExtracurricularHours();
  const totalHours = Object.values(subjectStats).reduce((a, b) => a + b, 0);

  const completed = todos.filter(t => t.status === 'completed').length;
  const pending = todos.filter(t => t.status === 'pending').length;
  const completionRate = Math.round((completed / (completed + pending)) * 100) || 0;

  // 课外班天数
  const classDays = new Set(extracurricularCourses.map(s => {
    // API 返回的字段可能是 dayOfWeek 或 day
    return s.dayOfWeek !== undefined ? s.dayOfWeek : s.day;
  })).size;
  
  // 课外班数量
  const totalExtracurricularClasses = extracurricularCourses.length;

  // 待办统计
  const todoStats = {
    '比赛': todos.filter(t => t.category === '比赛').length,
    '考试': todos.filter(t => t.category === '考试').length,
    '学习': todos.filter(t => t.category === '学习').length,
  };

  // 作业统计
  const assignmentStats = {
    total: assignments.length,
    active: assignments.filter(a => a.status === 'active').length,
    completed: assignments.filter(a => a.status === 'completed').length
  };

  // 课内课程总数
  const totalSchoolClasses = schoolSchedule.reduce((sum, day) => sum + day.courses.length, 0);

  return (
    <div className="p-6 space-y-6">
      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>📈 统计分析</h2>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="待办完成率" value={`${completionRate}%`} icon="✅" colorType="indigo" darkMode={darkMode} />
        <StatCard 
          title={courseType === 'school' ? '课内时长' : '课外班时长'} 
          value={`${totalHours.toFixed(1)}h`} 
          icon="📚" 
          colorType="blue" 
          darkMode={darkMode} 
        />
        <StatCard title="体育时长" value={`${subjectStats.sports.toFixed(1)}h`} icon="🏃" colorType="green" darkMode={darkMode} />
        <StatCard 
          title={courseType === 'school' ? '课内节数' : '课外班数量'} 
          value={courseType === 'school' ? `${totalSchoolClasses}节` : `${totalExtracurricularClasses}个`} 
          icon="📅" 
          colorType="orange" 
          darkMode={darkMode} 
        />
      </div>

      {/* 两栏：学习规划 + 各科时长 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 学习规划统计 */}
        <div className={`rounded-xl shadow-sm p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📚 学习规划统计</h3>
          <div className="space-y-4">
            <div className={`flex justify-between items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>学习规划</span>
              <span className="font-bold text-2xl text-indigo-600">{plans.length}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>课外班数量</span>
              <span className="font-bold text-2xl text-blue-600">{extracurricularCourses.length}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {courseType === 'school' ? '每周课内课时' : '每周课外班'}
              </span>
              <span className="font-bold text-2xl text-green-600">
                {courseType === 'school' ? `${totalSchoolClasses} 节` : `${classDays} 天`}
              </span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {courseType === 'school' ? '课内学习时长' : '课外学习时长'}
              </span>
              <span className="font-bold text-2xl text-orange-600">{totalHours.toFixed(1)} 小时</span>
            </div>
          </div>
        </div>

        {/* 各科时长统计 */}
        <div className={`rounded-xl shadow-sm p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>📊 每周各科学习时长</h3>
            {/* 课内/课外切换 */}
            <div className={`flex rounded-lg p-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button
                onClick={() => setCourseType('school')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${courseType === 'school' ? 'bg-indigo-600 text-white' : (darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')}`}
              >
                🏫 课内
              </button>
              <button
                onClick={() => setCourseType('extracurricular')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${courseType === 'extracurricular' ? 'bg-indigo-600 text-white' : (darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')}`}
              >
                🎯 课外
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            <SubjectBar subject="数学" hours={subjectStats.math} total={totalHours} color="bg-blue-500" icon="🔢" darkMode={darkMode} />
            <SubjectBar subject="英语" hours={subjectStats.english} total={totalHours} color="bg-green-500" icon="🔤" darkMode={darkMode} />
            <SubjectBar subject="语文" hours={subjectStats.chinese} total={totalHours} color="bg-red-500" icon="📖" darkMode={darkMode} />
            <SubjectBar subject="体育" hours={subjectStats.sports} total={totalHours} color="bg-orange-500" icon="🏃" darkMode={darkMode} />
            <SubjectBar subject="艺术" hours={subjectStats.art} total={totalHours} color="bg-purple-500" icon="🎨" darkMode={darkMode} />
            <SubjectBar subject="科学" hours={subjectStats.science} total={totalHours} color="bg-cyan-500" icon="🔬" darkMode={darkMode} />
          </div>
          <div className={`mt-4 pt-4 border-t text-right ${darkMode ? 'border-gray-700 text-gray-400' : 'text-gray-500'}`}>
            <span className="text-sm">
              {courseType === 'school' ? '🏫 课内' : '🎯 课外'}总计：
            </span>
            <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{totalHours.toFixed(1)}</span> 
            <span className="text-sm">小时/周</span>
            {courseType === 'school' && (
              <span className={`text-xs ml-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                (每节课40分钟)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 待办事项统计 */}
      <div className={`rounded-xl shadow-sm p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>✅ 待办事项统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{todos.length}</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>待办总数</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
            <div className="text-3xl font-bold text-green-600">{completed}</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>已完成</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
            <div className="text-3xl font-bold text-orange-600">{pending}</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>待完成</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <div className="text-3xl font-bold text-indigo-600">{completionRate}%</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>完成率</div>
          </div>
        </div>
        
        {/* 分类统计 */}
        <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : ''}`}>
          <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>分类统计</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
              <div className="font-bold text-2xl text-red-600">{todoStats['比赛']}</div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>比赛</div>
            </div>
            <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <div className="font-bold text-2xl text-blue-600">{todoStats['考试']}</div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>考试</div>
            </div>
            <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
              <div className="font-bold text-2xl text-green-600">{todoStats['学习']}</div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>学习</div>
            </div>
          </div>
        </div>
      </div>

      {/* 作业统计 */}
      <div className={`rounded-xl shadow-sm p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📝 作业统计</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{assignmentStats.total}</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>作业总数</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <div className="text-3xl font-bold text-blue-600">{assignmentStats.active}</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>进行中</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
            <div className="text-3xl font-bold text-green-600">{assignmentStats.completed}</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>已完成</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 辅助函数：计算时长（支持多种时间格式）
function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  
  try {
    // 处理时间格式：HH:mm:ss 或 HH:mm
    const parseTime = (time) => {
      if (!time) return null;
      const parts = String(time).split(':');
      if (parts.length >= 2) {
        return {
          hours: parseInt(parts[0], 10),
          minutes: parseInt(parts[1], 10)
        };
      }
      return null;
    };

    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    if (!start || !end) return 0;
    
    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;
    
    // 返回小时数
    return Math.max(0, (endMinutes - startMinutes) / 60);
  } catch (e) {
    console.error('计算时长错误:', e, startTime, endTime);
    return 0;
  }
}

const StatCard = ({ title, value, icon, colorType, darkMode = false }) => {
  const colorMap = {
    indigo: darkMode ? 'bg-indigo-900/50' : 'bg-indigo-50',
    blue: darkMode ? 'bg-blue-900/50' : 'bg-blue-50',
    green: darkMode ? 'bg-green-900/50' : 'bg-green-50',
    orange: darkMode ? 'bg-orange-900/50' : 'bg-orange-50',
  };
  
  return (
    <div className={`rounded-xl p-5 ${colorMap[colorType] || colorMap.indigo}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{value}</p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
};

const SubjectBar = ({ subject, hours, total, color, icon, darkMode = false }) => {
  const percentage = total > 0 ? (hours / total) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <span className={`w-20 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-1`}>
        <span>{icon}</span> {subject}
      </span>
      <div className={`flex-1 rounded-full h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div 
          className={`${color} h-4 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`w-16 text-right font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {hours.toFixed(1)}h
      </span>
    </div>
  );
};

export default Stats;