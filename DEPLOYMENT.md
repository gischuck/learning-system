# William 学习规划系统 - 部署说明

## 系统概述

William 学习规划系统是一个帮助家长管理孩子学习规划的全栈 Web 应用。

### 功能列表

- 📊 **控制台** - 数据概览、统计信息、近期提醒
- 📋 **近期待办** - 待办事项管理（支持比赛/考试/学习分类）
- 📝 **作业布置** - 作业任务管理、状态跟踪
- 📚 **学习规划** - 课程表管理（校内+课外）、便签功能
- 📖 **育儿笔记** - 育儿经验记录
- 📈 **统计分析** - 学习时长统计（课内/课外切换）
- 👦 **孩子看板** - 孩子专用界面，无需登录
- 🤖 **智慧助手** - AI 驱动的智能问答（支持对话记忆）

---

## 环境要求

- **Node.js**: v18+ 
- **npm**: v9+
- **操作系统**: Linux / macOS / Windows

---

## 快速部署

### 1. 解压文件

```bash
unzip william-learning-system.zip
cd william-learning-system
```

### 2. 安装依赖

```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

### 3. 配置环境变量

编辑 `backend/.env`：

```env
# 服务器配置
PORT=3001
NODE_ENV=production
DB_SYNC_MODE=none

# 数据库
DB_PATH=./data/william_learning.db

# JWT配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# AI 配置（可选，配置后智慧助手可用 AI 功能）
AI_API_KEY=your-api-key
AI_API_ENDPOINT=https://api.example.com/v1
AI_MODEL=gpt-3.5-turbo
```

### 4. 初始化数据库

```bash
cd backend
npm run init-db
```

### 5. 启动服务

**开发环境：**

```bash
# 后端
cd backend
npm run dev

# 前端（新终端）
cd frontend
npm run dev
```

**生产环境：**

```bash
# 使用 PM2（推荐）
npm install -g pm2

# 启动后端
cd backend
pm2 start src/app.js --name william-backend

# 启动前端
cd frontend
npm run build
pm2 serve dist 3000 --name william-frontend --spa
```

### 6. 访问系统

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:3001/api
- **健康检查**: http://localhost:3001/api/health

---

## 默认账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员/家长 |

> ⚠️ 生产环境请修改默认密码！

---

## 目录结构

```
william-learning-system/
├── backend/                    # 后端代码
│   ├── src/
│   │   ├── app.js             # 应用入口
│   │   ├── config/            # 配置
│   │   ├── controllers/       # 控制器
│   │   ├── middleware/        # 中间件
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # API 路由
│   │   └── services/          # 服务层
│   ├── data/                  # SQLite 数据库
│   ├── backups/               # 数据库备份
│   ├── scripts/               # 脚本
│   ├── .env                   # 环境变量
│   └── package.json
│
├── frontend/                   # 前端代码
│   ├── src/
│   │   ├── components/        # React 组件
│   │   ├── contexts/          # React Context
│   │   ├── utils/             # 工具函数
│   │   ├── App.jsx            # 主应用
│   │   └── main.jsx           # 入口
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── DEPLOYMENT.md              # 本文件
```

---

## API 端点

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户
- `PUT /api/auth/password` - 修改密码

### 数据管理
- `GET/POST/PUT/DELETE /api/plans` - 学习规划
- `GET/POST/PUT/DELETE /api/todos` - 待办事项
- `GET/POST/PUT/DELETE /api/schedules` - 课程表
- `GET/POST/PUT/DELETE /api/assignments` - 作业
- `GET/POST/PUT/DELETE /api/notes` - 笔记

### 同步
- `POST /api/sync/all` - 完整同步
- `POST /api/sync/export` - 导出数据
- `POST /api/sync/import` - 导入数据
- `POST /api/sync/backup` - 备份数据库

### 智慧助手
- `POST /api/assistant/chat` - AI 对话

---

## 定时任务

系统内置以下定时任务：

- **每天 02:00** - 自动同步数据到 Google（需配置）
- **每天 03:00** - 数据库自动备份
- **每天 08:00** - 检查并发送提醒

---

## 数据备份

### 手动备份

1. **通过界面**: 点击用户头像 → 数据管理 → 服务器备份
2. **命令行**: 
   ```bash
   cp backend/data/william_learning.db backend/backups/backup_$(date +%Y%m%d).db
   ```

### 自动备份

备份文件保存在 `backend/backups/` 目录，自动清理 30 天前的备份。

---

## 故障排查

### 后端无法启动

1. 检查端口是否被占用：`lsof -i :3001`
2. 检查数据库文件：`ls backend/data/`
3. 查看日志：`tail -f backend/app.log`

### 前端无法访问

1. 检查后端是否运行：`curl http://localhost:3001/api/health`
2. 检查前端开发服务器：`npm run dev`

### AI 助手不工作

1. 检查 `.env` 中的 AI 配置
2. 验证 API Key 是否有效
3. 查看后端日志中的 `[AI]` 相关信息

---

## 安全建议

1. **修改默认密码** - 生产环境必须修改 admin 密码
2. **更改 JWT_SECRET** - 使用强随机字符串
3. **HTTPS** - 生产环境建议使用 HTTPS
4. **防火墙** - 仅开放必要端口（80/443）

---

## 更新日志

### v1.0.0 (2026-03-23)
- 初始版本发布
- 完整的学习规划功能
- AI 智慧助手
- 数据导入导出
- 定时备份

---

## 技术支持

如有问题，请联系开发团队。