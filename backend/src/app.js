// 首先加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const { sequelize } = require('./config/database');
const googleSyncService = require('./services/googleSyncService');

// 导入路由
const authRoutes = require('./routes/authRoutes');
const planRoutes = require('./routes/planRoutes');
const todoRoutes = require('./routes/todoRoutes');
const taskRoutes = require('./routes/taskRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const apiRoutes = require('./routes/api');
const syncRoutes = require('./routes/syncRoutes');
const wishRoutes = require('./routes/wishRoutes');
const starRoutes = require('./routes/starRoutes');
const habitRoutes = require('./routes/habitRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const aiActionRoutes = require('./routes/aiActionRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 请求日志
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// JSON解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api', apiRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/wishes', wishRoutes);
app.use('/api/stars', starRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/ai', aiActionRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API信息
app.get('/api', (req, res) => {
  res.json({
    name: 'William学习看板 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      plans: '/api/plans',
      todos: '/api/todos',
      tasks: '/api/tasks',
      schedules: '/api/schedules',
      notes: '/api/notes',
      family: '/api/family',
      timeline: '/api/timeline',
      sync: '/api/sync'
    }
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  
  // Sequelize验证错误
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的令牌'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '令牌已过期'
    });
  }

  // 默认错误
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

// 定时任务配置
function setupCronJobs() {
  // 每天凌晨 2:00 自动同步（包含备份）
  const autoSyncEnabled = process.env.AUTO_SYNC !== 'false';
  
  if (autoSyncEnabled) {
    cron.schedule('0 2 * * *', async () => {
      console.log('[Cron] 开始定时同步任务...');
      try {
        const result = await googleSyncService.syncAll();
        console.log('[Cron] 定时同步完成:', JSON.stringify(result.results));
      } catch (error) {
        console.error('[Cron] 定时同步失败:', error);
      }
    }, {
      timezone: 'Asia/Shanghai'
    });
    console.log('✅ 定时同步任务已配置 (每天 02:00，含备份)');
  }

  // 每天凌晨 3:00 单独备份数据库
  cron.schedule('0 3 * * *', async () => {
    console.log('[Cron] 开始数据库备份...');
    try {
      await googleSyncService.backupDatabase();
      console.log('[Cron] 数据库备份完成');
    } catch (error) {
      console.error('[Cron] 数据库备份失败:', error);
    }
  }, {
    timezone: 'Asia/Shanghai'
  });
  console.log('✅ 定时备份任务已配置 (每天 03:00)');

  // 每天早上 8:00 检查提醒
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] 检查提醒任务...');
    try {
      const { Todo, Assignment } = require('./models');
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      
      // 检查 1 个月内到期的比赛/考试报名
      const upcomingTodos = await Todo.findAll({
        where: {
          status: 'pending',
          dueDate: {
            [require('sequelize').Op.between]: [new Date().toISOString().split('T')[0], oneMonthLater.toISOString().split('T')[0]]
          },
          category: ['比赛', '考试']
        }
      });
      
      if (upcomingTodos.length > 0) {
        console.log(`[Cron] 发现 ${upcomingTodos.length} 个即将到期的任务`);
        upcomingTodos.forEach(todo => {
          console.log(`  - ${todo.title}: ${todo.dueDate}`);
        });
      }
      
      // 检查已完成的作业（用于推送）
      const completedAssignments = await Assignment.findAll({
        where: { status: 'completed' },
        order: [['completedAt', 'DESC']],
        limit: 5
      });
      
      if (completedAssignments.length > 0) {
        console.log(`[Cron] 今日完成 ${completedAssignments.length} 个作业`);
      }
      
      console.log('[Cron] 提醒检查完成');
    } catch (error) {
      console.error('[Cron] 提醒检查失败:', error);
    }
  }, {
    timezone: 'Asia/Shanghai'
  });
  console.log('✅ 定时提醒任务已配置 (每天 08:00)');

  // 每天凌晨 0:05 重置每日作业（已审核通过的）
  cron.schedule('5 0 * * *', async () => {
    console.log('[Cron] 重置每日作业...');
    try {
      const { Assignment } = require('./models');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // 重置昨天已审核通过的每日作业
      const result = await Assignment.update(
        { 
          status: 'active', 
          approvalStatus: null, 
          completedAt: null, 
          completedBy: null,
          approvedAt: null,
          approvedBy: null
        },
        { 
          where: { 
            recurringType: 'daily',
            status: 'completed',
            approvalStatus: 'approved'
          } 
        }
      );
      
      console.log(`[Cron] 已重置 ${result[0]} 个每日作业`);
    } catch (error) {
      console.error('[Cron] 重置每日作业失败:', error);
    }
  }, {
    timezone: 'Asia/Shanghai'
  });
  console.log('✅ 定时重置任务已配置 (每天 00:05)');
}

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 同步数据库（生产环境不要使用 alter: true）
    const dbSyncMode = process.env.DB_SYNC_MODE || 'safe'; // 'safe', 'alter', 'force'
    const syncOptions = {}; // 默认只创建不存在的表
    if (dbSyncMode === 'alter') syncOptions.alter = true;
    if (dbSyncMode === 'force') syncOptions.force = true;
    await sequelize.sync(syncOptions);
    console.log(`✅ 数据库已同步 (模式: ${dbSyncMode})`);
    
    // 创建默认管理员账户（如果不存在）
    const { User } = require('./models');
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: '161214', // 会在hook中自动加密
        email: 'admin@example.com',
        role: 'admin',
        displayName: '管理员'
      });
      console.log('✅ 默认管理员账户已创建 (用户名: admin, 密码: 161214)');
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 服务器运行在 http://0.0.0.0:${PORT}`);
      console.log(`📊 健康检查: http://0.0.0.0:${PORT}/api/health`);
      console.log(`📚 API文档: http://0.0.0.0:${PORT}/api`);
    });
    
    // 设置定时任务
    setupCronJobs();
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app; // 用于测试