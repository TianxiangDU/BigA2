"""
BigA2 后端服务入口
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import init_db
from routers import market, strategy, paper, review, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    # 启动时初始化数据库
    await init_db()
    yield
    # 关闭时清理


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="A股打板提示工具后端服务",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由
app.include_router(market.router, prefix="/api/market", tags=["市场数据"])
app.include_router(strategy.router, prefix="/api/strategy", tags=["策略"])
app.include_router(paper.router, prefix="/api/paper", tags=["模拟盘"])
app.include_router(review.router, prefix="/api/review", tags=["复盘"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["统计"])


@app.get("/")
async def root():
    return {"message": "BigA2 Server", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
