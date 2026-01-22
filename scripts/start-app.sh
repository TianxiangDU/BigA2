#!/bin/bash
# 启动前端应用

cd "$(dirname "$0")/../app"

# 复制环境变量文件
if [ ! -f ".env.local" ]; then
    cp .env.local.example .env.local
    echo "已创建 .env.local 文件"
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 启动开发服务器
echo "启动前端..."
npm run dev
