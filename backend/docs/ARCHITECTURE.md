# William家庭学习系统 - 后端架构设计文档

## 1. 项目概述

### 1.1 项目名称
William家庭学习规划与育儿经验管理系统

### 1.2 项目目标
为William家庭提供一体化的学习规划管理、育儿经验记录、家庭成员协作平台。

### 1.3 核心功能
- **学习规划管理**：课程、课外班、比赛的规划与追踪
- **育儿经验笔记**：记录育儿心得、教育经验
- **时间线功能**：可视化展示重要节点和里程碑
- **待办清单**：学习任务和事项的提醒
- **家庭成员协作**：爸爸、妈妈、孩子三方协同

---

## 2. 技术架构

### 2.1 技术栈选型
| 层次 | 技术 | 说明 |
|------|------|------|
| 后端框架 | Node.js + Express | 轻量、高效、生态丰富 |
| 数据库 | SQLite | 轻量级，适合家庭场景 |
| ORM | Sequelize | 成熟稳定，支持复杂查询 |
| 认证 | JWT | 无状态认证，支持多端 |
| API风格 | RESTful | 标准化接口设计 |

### 2.2 架构分层
```
┌─────────────────────────────────────────────────────────┐
│                      Client (前端)                       │
├─────────────────────────────────────────────────────────┤
│                    Express Server                       │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │  Routes  │Controllers│ Models  │   Middleware     │  │
│  └──────────┴──────────┴──────────┴──────────────────┘  │
├─────────────────────────────────────────────────────────┤
│              Sequelize ORM                              │
├─────────────────────────────────────────────────────────┤
│              SQLite Database                            │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 数据库设计

### 3.1 ER图
```
Users ||--o{ Plans : creates
Users ||--o{ Notes : writes
Users ||--o{ Todos : assigns
Users ||--o{ TimelineEvents : creates
Users ||--o{ FamilyMembers : manages
Plans ||--o{ PlanProgress : tracks
Plans ||--o{ TimelineEvents : generates
```

### 3.2 表结构设计

#### Users（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| username | VARCHAR(50) | 用户名 |
| password | VARCHAR(255) | 加密密码 |
| email | VARCHAR(100) | 邮箱 |
| role | ENUM | 角色：admin/parent/child |
| avatar | VARCHAR(255) | 头像URL |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### FamilyMembers（家庭成员表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| name | VARCHAR(50) | 姓名 |
| relation | ENUM | 关系：father/mother/child |
| user_id | INTEGER FK | 关联用户ID |
| birthday | DATE | 生日 |
| school | VARCHAR(100) | 学校 |
| grade | VARCHAR(20) | 年级 |
| avatar | VARCHAR(255) | 头像 |

#### Plans（学习规划表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| title | VARCHAR(200) | 标题 |
| description | TEXT | 描述 |
| type | ENUM | 类型：course/competition/activity |
| subject | VARCHAR(50) | 学科 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 结束日期 |
| status | ENUM | 状态：planned/active/completed/cancelled |
| priority | ENUM | 优先级：low/medium/high/urgent |
| created_by | INTEGER FK | 创建者 |
| assigned_to | INTEGER FK | 分配给 |

#### Notes（育儿经验笔记表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| title | VARCHAR(200) | 标题 |
| content | TEXT | 内容 |
| category | VARCHAR(50) | 分类 |
| tags | VARCHAR(255) | 标签（JSON数组）|
| is_public | BOOLEAN | 是否公开 |
| created_by | INTEGER FK | 创建者 |

#### Todos（待办事项表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| title | VARCHAR(200) | 标题 |
| description | TEXT | 描述 |
| due_date | DATE | 截止日期 |
| priority | ENUM | 优先级 |
| status | ENUM | 状态：pending/in_progress/completed |
| assigned_to | INTEGER FK | 分配给 |
| created_by | INTEGER FK | 创建者 |
| plan_id | INTEGER FK | 关联规划 |

#### TimelineEvents（时间线事件表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| title | VARCHAR(200) | 标题 |
| description | TEXT | 描述 |
| event_date | DATE | 事件日期 |
| event_type | ENUM | 类型：milestone/achievement/reminder |
| related_entity | VARCHAR(50) | 关联实体类型 |
| related_id | INTEGER | 关联实体ID |
| importance | ENUM | 重要性：low/medium/high |
| created_by | INTEGER FK | 创建者 |

---

## 4. API接口设计

### 4.1 基础路径
```
/api/v1
```

### 4.2 接口列表

#### 认证模块
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/register | 注册 |
| POST | /auth/login | 登录 |
| POST | /auth/logout | 登出 |
| GET | /auth/me | 获取当前用户 |

#### 用户模块
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /users | 用户列表 |
| GET | /users/:id | 用户详情 |
| PUT | /users/:id | 更新用户 |
| DELETE | /users/:id | 删除用户 |

#### 家庭成员模块
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /family-members | 成员列表 |
| POST | /family-members | 添加成员 |
| GET | /family-members/:id | 成员详情 |
| PUT | /family-members/:id | 更新成员 |
| DELETE | /family-members/:id | 删除成员 |

#### 学习规划模块
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /plans | 规划列表 |
| POST | /plans | 创建规划 |
| GET | /plans/:id | 规划详情 |
| PUT | /plans/:id | 更新规划 |
| DELETE | /plans/:id | 删除规划 |
| GET | /plans/:id/progress | 获取进度 |
| POST | /plans/:id/progress | 更新进度 |

#### 笔记模块
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /notes | 笔记列表 |
| POST | /notes | 创建笔记 |
| GET | /notes/:id | 笔记详情 |
| PUT | /notes/:id | 更新笔记 |
| DELETE | /notes/:id | 删除笔记 |
| GET | /notes/search | 搜索笔记 |

#### 待办事项模块
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /todos | 待办列表 |
| POST | /todos | 创建待办 |
| GET | /todos/:id | 待办详情 |
| PUT | /todos/:id | 更新待办 |
| DELETE | /todos/:id | 删除待办 |
| PUT | /todos/:id/complete | 完成待办 |

#### 时间线模块
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /timeline | 时间线列表 |
| POST | /timeline | 创建事件 |
| GET | /timeline/:id | 事件详情 |
| PUT | /timeline/:id | 更新事件 |
| DELETE | /timeline/:id | 删除事件 |

---

## 5. 安全设计

### 5.1 认证方式
- JWT Token认证
- Token有效期：7天
- 支持Token刷新

### 5.2 权限控制
- 基于角色的访问控制（RBAC）
- 角色：admin, parent, child
- 资源级权限检查

### 5.3 数据安全
- 密码bcrypt加密存储
- SQL注入防护（Sequelize参数化查询）
- 输入数据验证

---

## 6. 部署方案

### 6.1 环境要求
- Node.js >= 16.x
- SQLite3

### 6.2 目录结构
```
backend/
├── src/
│   ├── config/        # 配置文件
│   ├── models/        # 数据模型
│   ├── routes/        # 路由定义
│   ├── controllers/   # 控制器
│   ├── middleware/    # 中间件
│   └── utils/         # 工具函数
├── migrations/        # 数据库迁移
├── tests/            # 测试文件
└── docs/             # 文档
```

### 6.3 启动方式
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

---

## 7. 扩展计划

### 7.1 近期功能
- [ ] 文件上传（学习资料）
- [ ] 数据统计看板
- [ ] 消息通知

### 7.2 远期规划
- [ ] 移动端适配
- [ ] 与其他教育平台集成
- [ ] AI学习建议
