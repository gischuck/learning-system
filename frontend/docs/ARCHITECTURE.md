# William家庭学习系统 - 前端架构设计文档

## 1. 项目概述

### 1.1 项目背景
为William家庭打造的学习规划与育儿经验管理系统，支持学习规划管理、育儿笔记记录、时间线可视化、待办清单和家庭成员协作。

### 1.2 目标用户
- **主要用户**: William爸爸（管理员）
- **协作用户**: 家庭成员（妈妈、William等）

### 1.3 核心功能
1. 学习规划面板（课程表、课外班、比赛）
2. 育儿经验笔记（富文本编辑器）
3. 时间线视图（可视化重要节点）
4. 待办清单（TodoList）
5. 家庭成员协作界面

---

## 2. 技术栈选型

### 2.1 核心框架
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |

### 2.2 UI与样式
| 技术 | 用途 |
|------|------|
| Tailwind CSS | 原子化CSS框架 |
| Headless UI | 无样式UI组件 |
| Lucide React | 图标库 |

### 2.3 状态管理
| 技术 | 用途 |
|------|------|
| React Query | 服务端状态管理 |
| Zustand | 客户端全局状态 |

### 2.4 编辑器与工具
| 技术 | 用途 |
|------|------|
| TipTap | 富文本编辑器 |
| date-fns | 日期处理 |
| react-big-calendar | 日历组件 |

---

## 3. 项目结构

```
frontend/
├── docs/                      # 文档
│   └── ARCHITECTURE.md       # 架构设计文档
├── public/                    # 静态资源
├── src/
│   ├── api/                   # API接口层
│   │   ├── client.ts         # HTTP客户端
│   │   ├── study.ts          # 学习规划API
│   │   ├── notes.ts          # 笔记API
│   │   ├── timeline.ts       # 时间线API
│   │   └── todos.ts          # 待办API
│   ├── components/            # 组件层
│   │   ├── common/           # 通用组件
│   │   ├── plan/             # 学习规划组件
│   │   ├── timeline/         # 时间线组件
│   │   ├── todo/             # 待办组件
│   │   └── notes/            # 笔记组件
│   ├── hooks/                 # 自定义Hooks
│   ├── pages/                 # 页面层
│   ├── types/                 # TypeScript类型定义
│   ├── utils/                 # 工具函数
│   ├── stores/                # 状态管理
│   ├── App.tsx               # 根组件
│   └── main.tsx              # 入口文件
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 4. 组件架构

### 4.1 组件分层

```
┌─────────────────────────────────────┐
│           Page Layer                │  ← 页面组件，处理路由
│    (Dashboard, StudyPlan, etc.)     │
├─────────────────────────────────────┤
│         Feature Layer               │  ← 业务组件
│  (PlanCard, Timeline, TodoList)     │
├─────────────────────────────────────┤
│         Common Layer                │  ← 通用组件
│    (Button, Modal, Card, Input)     │
└─────────────────────────────────────┘
```

### 4.2 核心组件清单

| 组件名 | 类型 | 功能描述 |
|--------|------|----------|
| PlanCard | Feature | 学习规划卡片（课程/比赛/课外班） |
| Timeline | Feature | 时间线视图组件 |
| TodoList | Feature | 待办清单组件 |
| NoteEditor | Feature | 富文本笔记编辑器 |
| StudyCalendar | Feature | 学习日历视图 |
| MemberAvatar | Common | 成员头像组件 |
| Tag | Common | 标签组件 |
| StatusBadge | Common | 状态徽章 |

---

## 5. 数据模型

### 5.1 核心类型定义

```typescript
// 学习规划
interface StudyPlan {
  id: string;
  title: string;
  type: 'course' | 'competition' | 'activity';
  subject: string;
  schedule: Schedule;
  location?: string;
  teacher?: string;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 时间线事件
interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  type: 'milestone' | 'achievement' | 'competition' | 'exam';
  description?: string;
  icon?: string;
  color?: string;
  tags: string[];
}

// 待办事项
interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: Date;
  assignee?: string;
  tags: string[];
  createdAt: Date;
  completedAt?: Date;
}

// 笔记
interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 家庭成员
interface FamilyMember {
  id: string;
  name: string;
  role: 'parent' | 'child' | 'other';
  avatar?: string;
  color: string;
}
```

---

## 6. API设计

### 6.1 RESTful接口规范

```
GET    /api/study-plans          # 获取学习规划列表
POST   /api/study-plans          # 创建学习规划
GET    /api/study-plans/:id      # 获取单个学习规划
PUT    /api/study-plans/:id      # 更新学习规划
DELETE /api/study-plans/:id      # 删除学习规划

GET    /api/timeline             # 获取时间线事件
POST   /api/timeline             # 创建时间线事件

GET    /api/todos                # 获取待办列表
POST   /api/todos                # 创建待办
PUT    /api/todos/:id/toggle     # 切换完成状态

GET    /api/notes                # 获取笔记列表
POST   /api/notes                # 创建笔记
PUT    /api/notes/:id            # 更新笔记
```

---

## 7. 路由设计

```typescript
const routes = [
  { path: '/', element: <Dashboard />, title: '概览' },
  { path: '/study', element: <StudyPlan />, title: '学习规划' },
  { path: '/timeline', element: <TimelineView />, title: '成长时间线' },
  { path: '/todos', element: <TodoPage />, title: '待办清单' },
  { path: '/notes', element: <NotesPage />, title: '育儿笔记' },
  { path: '/notes/:id', element: <NoteDetail />, title: '笔记详情' },
  { path: '/collaborate', element: <Collaborate />, title: '家庭协作' },
];
```

---

## 8. 状态管理策略

### 8.1 服务端状态（React Query）
- 学习规划数据
- 时间线事件
- 待办清单
- 笔记内容

### 8.2 客户端状态（Zustand）
- 用户认证信息
- UI状态（主题、侧边栏展开）
- 当前选中过滤条件
- 草稿状态

---

## 9. UI/UX设计规范

### 9.1 色彩系统
```
Primary:    #3B82F6 (蓝色)      - 主要操作、链接
Secondary:  #8B5CF6 (紫色)      - 次要操作
Success:    #10B981 (绿色)      - 成功、完成
Warning:    #F59E0B (橙色)      - 警告、提醒
Danger:     #EF4444 (红色)      - 错误、删除
Info:       #06B6D4 (青色)      - 信息提示

Background: #F8FAFC (浅灰)      - 背景
Surface:    #FFFFFF (白色)      - 卡片表面
Text:       #1E293B (深灰)      - 主要文字
TextMuted:  #64748B (中灰)      - 次要文字
```

### 9.2 主题成员色
```
William爸爸: #3B82F6 (蓝)
William妈妈: #EC4899 (粉)
William:     #10B981 (绿)
```

### 9.3 学科色彩
```
数学: #EF4444 (红)
语文: #F59E0B (橙)
英语: #3B82F6 (蓝)
编程: #8B5CF6 (紫)
科学: #10B981 (绿)
```

---

## 10. 性能优化策略

1. **组件懒加载**: 路由级别代码分割
2. **虚拟列表**: 长列表使用虚拟滚动
3. **图片优化**: WebP格式、懒加载
4. **缓存策略**: React Query缓存、LocalStorage草稿
5. **防抖节流**: 搜索输入、滚动事件

---

## 11. 开发计划

### 第一阶段：基础架构
- [x] 项目初始化
- [x] 组件库搭建
- [x] 路由配置

### 第二阶段：核心功能
- [ ] 学习规划面板
- [ ] 待办清单
- [ ] 时间线视图

### 第三阶段：高级功能
- [ ] 富文本编辑器
- [ ] 家庭协作
- [ ] 数据同步

---

*文档版本: 1.0*
*更新日期: 2026-03-22*
