#!/bin/bash
# 同时启动前后端服务

SCRIPT_DIR="$(dirname "$0")"

echo "=========================================="
echo "BigA2 - A股打板提示工具"
echo "=========================================="

# 启动后端（后台运行）
echo "启动后端服务..."
cd "$SCRIPT_DIR/../server"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
    cp .env.example .env
fi

uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "后端服务已启动 (PID: $BACKEND_PID)"
echo "API 地址: http://localhost:8000"
echo "API 文档: http://localhost:8000/docs"

# 等待后端启动
sleep 2

# 启动前端
echo ""
echo "启动前端应用..."
cd "$SCRIPT_DIR/../app"

if [ ! -f ".env.local" ]; then
    cp .env.local.example .env.local 2>/dev/null || echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
fi

npm run dev &
FRONTEND_PID=$!

echo "前端服务已启动 (PID: $FRONTEND_PID)"
echo "访问地址: http://localhost:3000"
echo ""
echo "=========================================="
echo "按 Ctrl+C 停止所有服务"
echo "=========================================="

# 等待并处理退出
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
