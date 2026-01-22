"""
数据库配置与模型
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship

from config import get_settings

settings = get_settings()

engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# ============ 内容资产 ============
class ContentAsset(Base):
    """内容资产（文本/图片/视频）"""
    __tablename__ = "content_assets"
    
    id = Column(Integer, primary_key=True)
    type = Column(String(20), nullable=False)  # TEXT, IMAGE, VIDEO_LINK
    title = Column(String(200), nullable=False)
    raw_text = Column(Text)
    source_url = Column(String(500))
    attachments_json = Column(JSON)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)


# ============ 策略卡 ============
class StrategyCard(Base):
    """策略卡"""
    __tablename__ = "strategy_cards"
    
    id = Column(Integer, primary_key=True)
    strategy_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    status = Column(String(20), default="DRAFT")  # DRAFT, PUBLISHED, DEPRECATED
    current_version = Column(String(20), default="0.1.0")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    versions = relationship("StrategyCardVersion", back_populates="strategy")


class StrategyCardVersion(Base):
    """策略卡版本"""
    __tablename__ = "strategy_card_versions"
    
    id = Column(Integer, primary_key=True)
    strategy_id = Column(String(50), ForeignKey("strategy_cards.strategy_id"), nullable=False)
    version = Column(String(20), nullable=False)
    dsl_json = Column(JSON, nullable=False)
    source_asset_ids = Column(JSON)  # [asset_id, ...]
    published_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    strategy = relationship("StrategyCard", back_populates="versions")


# ============ 策略组 ============
class StrategyGroup(Base):
    """策略组"""
    __tablename__ = "strategy_groups"
    
    id = Column(Integer, primary_key=True)
    group_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    config_json = Column(JSON, nullable=False)  # strategies, weights, aggregation
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============ 策略运行记录 ============
class StrategyRun(Base):
    """策略运行记录"""
    __tablename__ = "strategy_runs"
    
    id = Column(Integer, primary_key=True)
    run_id = Column(String(50), unique=True, nullable=False)
    group_id = Column(String(50), nullable=False)
    ts = Column(DateTime, default=datetime.utcnow)
    input_hash = Column(String(64))
    input_snapshot_json = Column(JSON)
    per_strategy_results_json = Column(JSON)
    aggregated_result_json = Column(JSON)
    runtime_ms = Column(Integer)
    warnings_json = Column(JSON)


# ============ 提示卡 ============
class Alert(Base):
    """提示卡/信号卡"""
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True)
    alert_id = Column(String(50), unique=True, nullable=False)
    symbol = Column(String(20), nullable=False)
    ts = Column(DateTime, default=datetime.utcnow)
    snapshot_id = Column(String(50))
    group_id = Column(String(50))
    final_action = Column(String(20))  # ALLOW, WATCH, BLOCK
    signal_card_json = Column(JSON)
    policy_decision_json = Column(JSON)


# ============ 模拟盘 ============
class PaperOrder(Base):
    """模拟盘订单"""
    __tablename__ = "paper_orders"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(String(50), unique=True, nullable=False)
    symbol = Column(String(20), nullable=False)
    name = Column(String(50))
    side = Column(String(10), nullable=False)  # buy, sell
    qty = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    status = Column(String(20), default="pending")  # pending, filled, cancelled
    alert_id = Column(String(50))
    snapshot_id = Column(String(50))
    strategy_id = Column(String(50))
    group_id = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    filled_at = Column(DateTime)


class PaperPosition(Base):
    """模拟盘持仓"""
    __tablename__ = "paper_positions"
    
    id = Column(Integer, primary_key=True)
    symbol = Column(String(20), unique=True, nullable=False)
    name = Column(String(50))
    qty = Column(Integer, default=0)
    avg_cost = Column(Float, default=0)
    current_price = Column(Float)
    unrealized_pnl = Column(Float, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PaperTrade(Base):
    """模拟盘成交"""
    __tablename__ = "paper_trades"
    
    id = Column(Integer, primary_key=True)
    trade_id = Column(String(50), unique=True, nullable=False)
    order_id = Column(String(50), ForeignKey("paper_orders.order_id"), nullable=False)
    symbol = Column(String(20), nullable=False)
    side = Column(String(10), nullable=False)
    fill_qty = Column(Integer, nullable=False)
    fill_price = Column(Float, nullable=False)
    pnl = Column(Float, default=0)
    strategy_id = Column(String(50))
    group_id = Column(String(50))
    alert_id = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)


# ============ 复盘 ============
class Outcome(Base):
    """复盘结果"""
    __tablename__ = "outcomes"
    
    id = Column(Integer, primary_key=True)
    outcome_id = Column(String(50), unique=True, nullable=False)
    alert_id = Column(String(50), nullable=False)
    label = Column(String(20), nullable=False)  # SUCCESS, FAIL, SKIP
    pnl = Column(Float)
    notes = Column(Text)
    root_causes_json = Column(JSON)
    suggestions_json = Column(JSON)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============ 风控决策 ============
class RiskDecision(Base):
    """风控决策记录"""
    __tablename__ = "risk_decisions"
    
    id = Column(Integer, primary_key=True)
    decision_id = Column(String(50), unique=True, nullable=False)
    ts = Column(DateTime, default=datetime.utcnow)
    run_id = Column(String(50), nullable=True)  # 关联 strategy_runs
    snapshot_id = Column(String(50))
    input_hash = Column(String(64))
    
    # L0 硬闸门结果
    hard_gate_json = Column(JSON)  # {allow_new_trades, blocked_reason, triggered_rules}
    
    # L2 市场状态识别
    regime_json = Column(JSON)  # {regime, risk_light, recommended_groups, suggested_topk, reasons}
    
    # L1 风险预算
    risk_budget_json = Column(JSON)  # {max_total_position, max_single_position, max_new_trades, theme_exposure_caps, cooldown}
    
    # L3 二次闸门调整
    adjustments_json = Column(JSON)  # {downgrades: [], blocks: [], exposure_violations: [], anomalies: []}
    
    # 元信息
    meta_json = Column(JSON)  # {versions, warnings, confidence}
    
    # 关联字段
    alert_id = Column(String(50), nullable=True)
    order_id = Column(String(50), nullable=True)


# ============ 账户风控状态 ============
class AccountRiskState(Base):
    """账户风控状态（用于计算连亏、回撤等）"""
    __tablename__ = "account_risk_state"
    
    id = Column(Integer, primary_key=True)
    
    # 账户状态
    total_position = Column(Float, default=0)  # 总仓位比例
    drawdown = Column(Float, default=0)  # 当前回撤
    max_equity = Column(Float, default=100000)  # 历史最高权益
    current_equity = Column(Float, default=100000)  # 当前权益
    loss_streak = Column(Integer, default=0)  # 连亏次数
    
    # 主题暴露
    theme_exposure_json = Column(JSON)  # {theme: exposure_ratio}
    
    # 冷却期
    cooldown_until = Column(DateTime, nullable=True)
    cooldown_reason = Column(String(100), nullable=True)
    
    # 更新时间
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============ 数据库初始化 ============
async def init_db():
    """初始化数据库"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """获取数据库会话"""
    async with async_session() as session:
        yield session
