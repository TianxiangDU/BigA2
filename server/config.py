"""
服务配置
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""
    
    # 应用
    app_name: str = "BigA2 Server"
    debug: bool = True
    
    # 数据库
    database_url: str = "sqlite+aiosqlite:///./biga2.db"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # 数据源
    adata_cache_minutes: int = 1  # 行情缓存时间（分钟）
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
