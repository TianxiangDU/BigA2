#!/bin/bash
# 启动后端服务

cd "$(dirname "$0")/../server"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "安装依赖..."
pip install -r requirements.txt

# 复制环境变量文件
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "已创建 .env 文件"
fi

# 启动服务
echo "启动服务器..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000
