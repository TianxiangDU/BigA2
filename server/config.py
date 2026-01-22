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
    
    # ============ 风控配置（L0 Hard Gate） ============
    
    # 数据质量阈值
    max_data_lag_sec: int = 5  # 数据延迟超过此值触发降级
    
    # 市场极端阈值
    max_bomb_rate_red: float = 0.45  # 炸板率超过此值触发红灯
    max_down_limit_red: int = 80  # 跌停数超过此值触发红灯
    min_limit_up_for_green: int = 20  # 涨停数低于此值触发黄灯/红灯
    
    # 置信度阈值
    confidence_min_allow: float = 0.60  # 置信度低于此值不允许 ALLOW
    
    # 账户风控阈值
    max_drawdown_cooldown: float = 0.10  # 回撤超过 10% 触发冷却
    loss_streak_cooldown: int = 3  # 连亏 3 次触发冷却
    cooldown_minutes: int = 60  # 冷却期时长
    
    # ============ 风险预算默认值（L1） ============
    
    # 仓位限制
    default_max_total_position: float = 0.80  # 最大总仓位 80%
    default_max_single_position: float = 0.10  # 单票最大仓位 10%
    default_max_new_trades: int = 5  # 每日最大新增交易数
    
    # 主题暴露限制
    default_theme_exposure_cap: float = 0.35  # 单主题最大暴露 35%
    
    # ============ 市场状态阈值（L2） ============
    
    # Regime 判断阈值
    regime_strong_limit_up_min: int = 80  # 强势市场涨停数下限
    regime_strong_bomb_rate_max: float = 0.20  # 强势市场炸板率上限
    regime_weak_limit_up_max: int = 30  # 弱势市场涨停数上限
    regime_chaos_down_limit_min: int = 50  # 混乱市场跌停数下限
    
    # TopK 候选池大小
    topk_strong: int = 30
    topk_divergence: int = 20
    topk_weak: int = 10
    topk_chaos: int = 5
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
