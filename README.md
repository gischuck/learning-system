# 🌟 Learning System - 孩子习惯养成系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/release/gischuck/learning-system.svg)](https://github.com/gischuck/learning-system/releases)
[![GitHub stars](https://img.shields.io/github/stars/gischuck/learning-system.svg)](https://github.com/gischuck/learning-system/stargazers)

> 一个程序员爸爸 + AI 协作开发的孩子习惯养成系统，完全开源免费！
> 
> Made with ❤️ by [OpenClaw](https://github.com/openclaw/openclaw) 🦞

---

## 🎯 项目起源

### 为什么做这个？

作为一个程序员爸爸，我发现三年级孩子的习惯养成简直是"吼催骂"循环：
- 早起喊三遍不起床
- 作业盯着写半天
- 玩游戏看电视要谈判
- 收书包催一百遍

**我决定用技术解决问题。**

### AI 协作开发

这个项目**完全由 AI 协助开发**，我主要负责：
- 📋 产品设计和需求梳理
- 🤝 和孩子多轮沟通需求
- ✅ 验收和反馈迭代

AI 负责：
- 💻 完整代码实现
- 🐛 Bug 修复
- 📖 文档编写

### 开发历程

- **开发时间**: 2 周
- **迭代版本**: 10+ 个版本
- **需求沟通**: 和孩子进行了 5+ 轮深度沟通
- **AI 对话**: 累计 100+ 轮对话

---

## 💡 需求设计过程

### 第一轮：和孩子聊痛点

> "爸爸，你每天催我做作业好烦啊！"

孩子的一句话，让我意识到**强制管理不如自主驱动**。

### 第二轮：讨论解决方案

> "如果我做一个系统，你做完作业可以赚星星换心愿，你觉得怎么样？"

孩子眼睛亮了："那我要换游乐园！还有乐高！"

### 第三轮：细化功能

和孩子一起讨论需要什么功能：
- ✅ **星星系统** - "做好事赚星星，做坏事扣星星"
- ✅ **心愿商城** - "把我的心愿放上去"
- ✅ **习惯打卡** - "我要打卡，自己点"
- ✅ **孩子看板** - "我有自己的页面"

### 第四轮：界面设计

孩子对界面有明确偏好：
- 🎨 "要可爱的，不要冷冰冰的"
- ⭐ "星星要多，要有等级"
- 🏆 "我要看到我多少颗星"

### 第五轮：持续迭代

上线后，孩子不断提出新需求：
- "爸爸，能不能加一个 AI 问答？"
- "作业能不能设置奖励星星？"
- "我想要看到历史记录"

---

## ✨ 功能特性

### 🧒 孩子端

| 功能 | 说明 |
|------|------|
| 习惯打卡 | 一键打卡早睡早起、收书包等习惯 |
| 星星等级 | 累计星星升级，从"小星星"到"超级巨星" |
| 心愿商城 | 积攒星星兑换心愿（游乐园、乐高、iPad...） |
| 课程表 | 今天有什么课，一目了然 |
| AI 问答 | 问 PET 备考、GESP 编程等问题 |

### 👨‍👩‍👧 家长端

| 功能 | 说明 |
|------|------|
| 习惯设置 | 自定义习惯类型、星星奖励规则 |
| 作业布置 | 布置作业任务，设置截止日期和奖励 |
| 待办管理 | 管理孩子的考试、比赛、活动 |
| 心愿审核 | 审核孩子提交的心愿 |
| 课程管理 | 管理孩子的课外班课程表 |
| 数据同步 | 自动同步到 Google Sheets |

---

## 📸 系统截图

### 1. 孩子看板 - 星星学院
![孩子看板](docs/screenshots/01_child_board.png)

### 2. 孩子看板 - 许下心愿
![许下心愿](docs/screenshots/02_child_wish.png)

### 3. 家长后台 - 控制台
![心愿商城](docs/screenshots/03_parent_wishes.png)

### 4. 心愿详情
![心愿详情](docs/screenshots/04_wish_detail.png)

### 5. 习惯设置
![习惯设置](docs/screenshots/05_habit_settings.png)

### 6. 统计信息
![登录页](docs/screenshots/06_static.png)

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

```bash
# 1. Clone 仓库
git clone https://github.com/gischuck/learning-system.git
cd learning-system

# 2. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 3. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env，填写必要配置

# 4. 启动服务
cd ..
./start.sh
```

### 访问系统

- 前端地址: http://localhost:3000
- 后端 API: http://localhost:3001/api
- 默认账户: admin / admin123

---

## ⚙️ 配置说明

### 环境变量

```env
# 服务器配置
PORT=3001

# JWT 密钥（用于用户登录认证，请设置一个随机字符串）
JWT_SECRET=your-jwt-secret-key

# AI 配置（支持 OpenAI 兼容接口）
AI_API_KEY=your-api-key-here
AI_API_ENDPOINT=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

### JWT_SECRET 是什么？

`JWT_SECRET` 是用于加密用户登录令牌的密钥。**请设置一个随机的、足够长的字符串**，例如：
- 随机生成：`openssl rand -hex 32`
- 或自己编一个：`my-super-secret-key-2024-change-me`

⚠️ 不要使用默认值，不要泄露给别人！

### AI 配置

系统支持任何 **OpenAI 兼容接口**，包括但不限于：

| 平台 | API Endpoint | 获取方式 |
|------|-------------|----------|
| OpenAI | https://api.openai.com/v1 | [官网](https://platform.openai.com/) |
| 阿里云百炼 | https://dashscope.aliyuncs.com/compatible-mode/v1 | [官网](https://bailian.console.aliyun.com/) |
| DeepSeek | https://api.deepseek.com/v1 | [官网](https://platform.deepseek.com/) |
| 智谱 AI | https://open.bigmodel.cn/api/paas/v4 | [官网](https://open.bigmodel.cn/) |
| Moonshot | https://api.moonshot.cn/v1 | [官网](https://platform.moonshot.cn/) |
| 本地模型 | http://localhost:11434/v1 | Ollama 等 |

只需修改 `AI_API_ENDPOINT` 和 `AI_MODEL` 即可！

---

## 🛠️ 技术栈

### 前端
- React 18
- Tailwind CSS
- Vite

### 后端
- Node.js + Express
- SQLite (Sequelize ORM)
- JWT 认证

### AI
- OpenAI 兼容接口

### 数据同步
- Google Sheets API (via gog)

---

## 🗺️ 开发计划

### v1.2 (计划中)
- [ ] **多孩子支持** - 一个系统管理多个孩子
- [ ] **更多 AI 功能** - 智能建议、学习规划

---

## 🤝 贡献

欢迎贡献代码、提出 Issue 或分享使用经验！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- **OpenClaw** 🦞 - AI 辅助开发平台，让编程更简单
- **我家孩子** - 提供了最真实的需求和反馈
- **开源社区** - React、Tailwind CSS、Express 等优秀项目

---

## 📮 联系方式

- GitHub Issues: [提交问题](https://github.com/gischuck/learning-system/issues)
- 欢迎 Star ⭐ 支持！

---

Made with ❤️ by OpenClaw 🦞
