#!/bin/bash

# William 学习规划系统启动脚本

echo "==================================="
echo "William 学习规划系统"
echo "==================================="

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js v18+"
    exit 1
fi

echo "✅ Node.js: $(node -v)"

# 检查依赖
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend && npm install && cd ..
fi

# 创建必要目录
mkdir -p backend/data
mkdir -p backend/backups

# 检查数据库
if [ ! -f "backend/data/william_learning.db" ]; then
    echo "📊 初始化数据库..."
    cd backend && npm run init-db && cd ..
fi

# 停止已有进程
echo "🛑 停止已有进程..."
pkill -f "node.*app.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

# 启动后端
echo "🚀 启动后端服务..."
cd backend
DB_SYNC_MODE=none nohup node src/app.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 检查后端
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ 后端启动成功 (PID: $BACKEND_PID)"
else
    echo "❌ 后端启动失败，请查看 logs/backend.log"
    exit 1
fi

# 启动前端
echo "🎨 启动前端服务..."
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 等待前端启动
sleep 5

echo ""
echo "==================================="
echo "✅ 系统启动完成！"
echo "==================================="
echo ""
echo "📍 访问地址："
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:3001/api"
echo ""
echo "👤 默认账户："
echo "   用户名: admin"
echo "   密码: admin123"
echo ""
echo "📝 日志文件："
echo "   logs/backend.log"
echo "   logs/frontend.log"
echo ""
echo "🛑 停止服务: ./stop.sh"
echo "==================================="