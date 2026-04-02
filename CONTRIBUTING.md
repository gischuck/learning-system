# Contributing to William Learning System

感谢你考虑为 William 学习规划系统做出贡献！

## 🤔 如何贡献

### 报告 Bug

如果你发现了 bug，请创建一个 [Issue](https://github.com/your-username/william-learning-system/issues)，包含：

1. **描述问题** - 清晰简洁地描述 bug
2. **复现步骤** - 详细说明如何复现
3. **期望行为** - 描述你期望发生什么
4. **实际行为** - 描述实际发生了什么
5. **截图** - 如果适用，添加截图帮助解释
6. **环境** - 操作系统、Node.js 版本等

### 提出新功能

如果你有新功能的想法：

1. 先在 [Discussions](https://github.com/your-username/william-learning-system/discussions) 中讨论
2. 说明功能的使用场景
3. 等待维护者反馈后再开始开发

### 提交代码

1. **Fork 仓库**
2. **创建分支**: `git checkout -b feature/AmazingFeature`
3. **编写代码**: 遵循现有代码风格
4. **测试**: 确保功能正常工作
5. **提交**: `git commit -m 'Add some AmazingFeature'`
6. **推送**: `git push origin feature/AmazingFeature`
7. **提交 PR**: 填写 PR 模板

## 📝 代码规范

### JavaScript/React

- 使用 ES6+ 语法
- 组件使用函数式组件 + Hooks
- 使用 `const` 和 `let`，避免 `var`
- 函数命名使用 camelCase
- 组件命名使用 PascalCase

### CSS

- 使用 Tailwind CSS 类名
- 遵循 mobile-first 原则
- 保持响应式设计

### Git Commit

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式（不影响功能）
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

## 🏗️ 开发环境设置

```bash
# 克隆你的 fork
git clone https://github.com/your-username/william-learning-system.git
cd william-learning-system

# 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 启动开发服务器
cd ../backend && npm run dev
# 另一个终端
cd frontend && npm run dev
```

## 📚 项目结构

```
william-learning-system/
├── backend/              # 后端代码
│   ├── src/
│   │   ├── controllers/  # 控制器
│   │   ├── models/       # 数据模型
│   │   ├── routes/       # 路由
│   │   └── services/     # 服务
│   └── data/             # 数据库文件
├── frontend/             # 前端代码
│   └── src/
│       ├── components/   # 组件
│       ├── hooks/        # 自定义 Hooks
│       └── utils/        # 工具函数
└── README.md
```

---

再次感谢你的贡献！🎉