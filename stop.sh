#!/bin/bash

# William 学习规划系统停止脚本

echo "==================================="
echo "停止 William 学习规划系统"
echo "==================================="

# 停止后端
echo "🛑 停止后端..."
pkill -f "node.*app.js" 2>/dev/null

# 停止前端
echo "🛑 停止前端..."
pkill -f "vite" 2>/dev/null

sleep 2

echo "✅ 服务已停止"