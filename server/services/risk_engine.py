"""
风控引擎 - 分层风控统一入口

分层架构：
- L0: Hard Gate（确定性硬规则，本模块实现）
- L1: Quant Risk Budget（风险预算，Agent MCP tool）
- L2: Regime Router（市场状态路由，Agent MCP tool）
- L3: Event/Anomaly Guard（异常风控，Agent MCP tool）
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import hashlib
import uuid

from config import get_settings

settings = get_settings()


# ============ 数据模型 ============

class DataQuality(BaseModel):
    """数据质量"""
    is_degraded: bool = False
    lag_sec: float = 0
    missing_fields: List[str] = []
    source: str = "eastmoney"
    ts: Optional[datetime] = None


class MarketContext(BaseModel):
    """市场上下文"""
    risk_light: str = "GREEN"  # GREEN, YELLOW, RED
    limit_up_count: int = 0
    limit_down_count: int = 0
    bomb_rate: float = 0
    sentiment: str = "中性"
    data_quality: DataQuality = DataQuality()


class Portfolio(BaseModel):
    """组合状态"""
    total_position: float = 0  # 总仓位比例
    drawdown: float = 0  # 当前回撤
    loss_streak: int = 0  # 连亏次数
    theme_exposure: Dict[str, float] = {}  # 主题暴露
    positions: List[Dict[str, Any]] = []  # 持仓列表


class InputBundle(BaseModel):
    """输入数据包"""
    market: MarketContext = MarketContext()
    portfolio: Portfolio = Portfolio()
    candidates: List[Dict[str, Any]] = []  # 候选股票
    ts: Optional[datetime] = None


# ============ 风控结果模型 ============

class HardGateResult(BaseModel):
    """L0 硬闸门结果"""
    allow_new_trades: bool = True
    blocked_reason: Optional[str] = None
    triggered_rules: List[Dict[str, Any]] = []


class RegimeResult(BaseModel):
    """L2 市场状态结果"""
    regime: str = "DIVERGENCE"  # STRONG, DIVERGENCE, WEAK, CHAOS
    risk_light: str = "GREEN"
    recommended_groups: List[str] = []
    suggested_topk: int = 20
    reasons: List[Dict[str, Any]] = []
    meta: Dict[str, Any] = {}


class RiskBudgetResult(BaseModel):
    """L1 风险预算结果"""
    allow_new_trades_suggested: bool = True
    max_total_position: float = 0.80
    max_single_position: float = 0.10
    max_new_trades: int = 5
    theme_exposure_caps: Dict[str, float] = {}
    cooldown: Dict[str, Any] = {"enabled": False, "until_ts": None, "reason": None}
    reasons: List[Dict[str, Any]] = []
    meta: Dict[str, Any] = {}


class AdjustmentItem(BaseModel):
    """调整项"""
    symbol: str
    to_action: str  # WATCH, BLOCK
    reason: str
    source: str  # exposure_manager, anomaly_guard


class AdjustmentsResult(BaseModel):
    """L3 二次闸门调整结果"""
    downgrades: List[AdjustmentItem] = []
    blocks: List[AdjustmentItem] = []
    exposure_violations: List[Dict[str, Any]] = []
    anomalies: List[Dict[str, Any]] = []


class RiskContext(BaseModel):
    """风控上下文（完整结果）"""
    hard_gate: HardGateResult = HardGateResult()
    regime: RegimeResult = RegimeResult()
    risk_budget: RiskBudgetResult = RiskBudgetResult()
    adjustments: AdjustmentsResult = AdjustmentsResult()
    meta: Dict[str, Any] = {}


# ============ L0 硬闸门实现 ============

def compute_hard_gate(input_bundle: InputBundle) -> HardGateResult:
    """
    L0 硬闸门 - 确定性规则，不可绕过
    
    触发条件：
    1. 数据降级/延迟
    2. 市场极端（红灯/高炸板率/高跌停数）
    3. 账户极端（回撤过大/连亏过多）
    """
    result = HardGateResult()
    triggered = []
    
    market = input_bundle.market
    portfolio = input_bundle.portfolio
    dq = market.data_quality
    
    # 规则 1: 数据质量检查
    if dq.is_degraded:
        result.allow_new_trades = False
        result.blocked_reason = "DATA_DEGRADED"
        triggered.append({
            "rule": "data_degraded",
            "value": True,
            "threshold": False,
            "impact": "BLOCK"
        })
    
    if dq.lag_sec > settings.max_data_lag_sec:
        result.allow_new_trades = False
        result.blocked_reason = "DATA_LAG"
        triggered.append({
            "rule": "data_lag_sec",
            "value": dq.lag_sec,
            "threshold": settings.max_data_lag_sec,
            "impact": "BLOCK"
        })
    
    # 规则 2: 市场极端检查
    if market.risk_light == "RED":
        result.allow_new_trades = False
        result.blocked_reason = "MARKET_RED"
        triggered.append({
            "rule": "risk_light",
            "value": "RED",
            "threshold": "not RED",
            "impact": "BLOCK"
        })
    
    if market.bomb_rate > settings.max_bomb_rate_red:
        result.allow_new_trades = False
        result.blocked_reason = "HIGH_BOMB_RATE"
        triggered.append({
            "rule": "bomb_rate",
            "value": market.bomb_rate,
            "threshold": settings.max_bomb_rate_red,
            "impact": "BLOCK"
        })
    
    if market.limit_down_count > settings.max_down_limit_red:
        result.allow_new_trades = False
        result.blocked_reason = "HIGH_DOWN_LIMIT"
        triggered.append({
            "rule": "down_limit_count",
            "value": market.limit_down_count,
            "threshold": settings.max_down_limit_red,
            "impact": "BLOCK"
        })
    
    # 规则 3: 账户极端检查
    if portfolio.drawdown > settings.max_drawdown_cooldown:
        result.allow_new_trades = False
        result.blocked_reason = "ACCOUNT_DRAWDOWN"
        triggered.append({
            "rule": "drawdown",
            "value": portfolio.drawdown,
            "threshold": settings.max_drawdown_cooldown,
            "impact": "BLOCK"
        })
    
    if portfolio.loss_streak >= settings.loss_streak_cooldown:
        result.allow_new_trades = False
        result.blocked_reason = "ACCOUNT_LOSS_STREAK"
        triggered.append({
            "rule": "loss_streak",
            "value": portfolio.loss_streak,
            "threshold": settings.loss_streak_cooldown,
            "impact": "BLOCK"
        })
    
    result.triggered_rules = triggered
    return result


# ============ L2 市场状态识别（规则版） ============

def compute_market_regime(input_bundle: InputBundle) -> RegimeResult:
    """
    L2 市场状态识别 - 规则版（后续可替换为 Agent MCP）
    
    状态：
    - STRONG: 强势（涨停多、炸板率低）
    - DIVERGENCE: 分化（涨跌参半）
    - WEAK: 弱势（涨停少）
    - CHAOS: 混乱（跌停多、波动大）
    """
    market = input_bundle.market
    reasons = []
    
    limit_up = market.limit_up_count
    limit_down = market.limit_down_count
    bomb_rate = market.bomb_rate
    
    # 判断 regime
    if limit_up >= settings.regime_strong_limit_up_min and bomb_rate <= settings.regime_strong_bomb_rate_max:
        regime = "STRONG"
        suggested_topk = settings.topk_strong
        reasons.append({"key": "limit_up_count", "value": limit_up, "rule": f">={settings.regime_strong_limit_up_min}", "impact": "positive"})
        reasons.append({"key": "bomb_rate", "value": bomb_rate, "rule": f"<={settings.regime_strong_bomb_rate_max}", "impact": "positive"})
    elif limit_down >= settings.regime_chaos_down_limit_min:
        regime = "CHAOS"
        suggested_topk = settings.topk_chaos
        reasons.append({"key": "down_limit_count", "value": limit_down, "rule": f">={settings.regime_chaos_down_limit_min}", "impact": "negative"})
    elif limit_up <= settings.regime_weak_limit_up_max:
        regime = "WEAK"
        suggested_topk = settings.topk_weak
        reasons.append({"key": "limit_up_count", "value": limit_up, "rule": f"<={settings.regime_weak_limit_up_max}", "impact": "negative"})
    else:
        regime = "DIVERGENCE"
        suggested_topk = settings.topk_divergence
        reasons.append({"key": "market_mixed", "value": f"up:{limit_up},down:{limit_down}", "rule": "分化市场", "impact": "neutral"})
    
    # 计算 risk_light
    if market.risk_light != "GREEN":
        risk_light = market.risk_light
    elif bomb_rate > 0.30:
        risk_light = "YELLOW"
        reasons.append({"key": "bomb_rate_warning", "value": bomb_rate, "rule": ">0.30 => YELLOW", "impact": "warning"})
    elif limit_up < settings.min_limit_up_for_green:
        risk_light = "YELLOW"
        reasons.append({"key": "low_limit_up", "value": limit_up, "rule": f"<{settings.min_limit_up_for_green} => YELLOW", "impact": "warning"})
    else:
        risk_light = "GREEN"
    
    # 推荐策略组（根据 regime）
    recommended_groups = []
    if regime == "STRONG":
        recommended_groups = ["grp_aggressive", "grp_reseal_main"]
    elif regime == "DIVERGENCE":
        recommended_groups = ["grp_reseal_main", "grp_firstseal_guard"]
    elif regime == "WEAK":
        recommended_groups = ["grp_conservative", "grp_firstseal_guard"]
    else:  # CHAOS
        recommended_groups = []  # 不推荐任何策略组
    
    return RegimeResult(
        regime=regime,
        risk_light=risk_light,
        recommended_groups=recommended_groups,
        suggested_topk=suggested_topk,
        reasons=reasons,
        meta={
            "agent": "market_regime",
            "version": "0.1.0",
            "confidence": 0.75,
            "warnings": []
        }
    )


# ============ L1 风险预算（规则版） ============

def compute_risk_budget(input_bundle: InputBundle) -> RiskBudgetResult:
    """
    L1 风险预算 - 规则版（后续可替换为 Agent MCP）
    
    根据市场状态和账户状态动态调整：
    - 最大总仓位
    - 单票最大仓位
    - 最大新增交易数
    - 主题暴露上限
    """
    market = input_bundle.market
    portfolio = input_bundle.portfolio
    reasons = []
    
    # 基础值
    max_total = settings.default_max_total_position
    max_single = settings.default_max_single_position
    max_new = settings.default_max_new_trades
    
    # 根据 risk_light 调整
    if market.risk_light == "YELLOW":
        max_total *= 0.85
        max_single *= 0.80
        max_new -= 1
        reasons.append({"key": "risk_light", "value": "YELLOW", "rule": "total*0.85, single*0.80, new-1"})
    elif market.risk_light == "RED":
        max_total *= 0.50
        max_single *= 0.50
        max_new = 0
        reasons.append({"key": "risk_light", "value": "RED", "rule": "total*0.50, single*0.50, new=0"})
    
    # 根据回撤调整
    if portfolio.drawdown > 0.05:
        adjustment = min(portfolio.drawdown * 2, 0.30)  # 最多降 30%
        max_total *= (1 - adjustment)
        max_single *= (1 - adjustment)
        reasons.append({"key": "drawdown", "value": portfolio.drawdown, "rule": f"仓位降 {adjustment*100:.0f}%"})
    
    # 根据连亏调整
    if portfolio.loss_streak >= 2:
        max_single -= 0.02 * (portfolio.loss_streak - 1)
        max_new = max(1, max_new - portfolio.loss_streak + 1)
        reasons.append({"key": "loss_streak", "value": portfolio.loss_streak, "rule": "single-0.02, new-1 per streak"})
    
    # 主题暴露上限
    theme_caps = {}
    for theme, exposure in portfolio.theme_exposure.items():
        cap = settings.default_theme_exposure_cap
        if exposure > cap * 0.8:
            # 已接近上限，收紧
            cap *= 0.9
        theme_caps[theme] = cap
    
    # 冷却期检查
    cooldown = {"enabled": False, "until_ts": None, "reason": None}
    if portfolio.drawdown > settings.max_drawdown_cooldown:
        cooldown["enabled"] = True
        cooldown["until_ts"] = (datetime.utcnow() + timedelta(minutes=settings.cooldown_minutes)).isoformat()
        cooldown["reason"] = f"回撤超过 {settings.max_drawdown_cooldown*100}%"
    elif portfolio.loss_streak >= settings.loss_streak_cooldown:
        cooldown["enabled"] = True
        cooldown["until_ts"] = (datetime.utcnow() + timedelta(minutes=settings.cooldown_minutes)).isoformat()
        cooldown["reason"] = f"连亏 {portfolio.loss_streak} 次"
    
    return RiskBudgetResult(
        allow_new_trades_suggested=not cooldown["enabled"],
        max_total_position=round(max_total, 3),
        max_single_position=round(max_single, 3),
        max_new_trades=max(0, max_new),
        theme_exposure_caps=theme_caps,
        cooldown=cooldown,
        reasons=reasons,
        meta={
            "agent": "risk_budget",
            "version": "0.1.0",
            "confidence": 0.72,
            "warnings": []
        }
    )


# ============ L3 暴露管理（规则版） ============

def compute_exposure_adjustments(
    portfolio: Portfolio,
    candidates: List[Dict[str, Any]],
    risk_budget: RiskBudgetResult
) -> List[AdjustmentItem]:
    """
    L3 暴露管理 - 检查主题集中度
    """
    adjustments = []
    theme_caps = risk_budget.theme_exposure_caps
    
    # 计算当前暴露
    current_exposure = dict(portfolio.theme_exposure)
    
    for candidate in candidates:
        if candidate.get("action") != "ALLOW":
            continue
        
        theme = candidate.get("theme", "其他")
        cap = theme_caps.get(theme, settings.default_theme_exposure_cap)
        
        # 检查是否超过上限
        if current_exposure.get(theme, 0) >= cap:
            adjustments.append(AdjustmentItem(
                symbol=candidate["symbol"],
                to_action="WATCH",
                reason=f"{theme} 暴露 {current_exposure.get(theme, 0):.2f} >= {cap:.2f}",
                source="exposure_manager"
            ))
    
    return adjustments


# ============ L3 异常检测（规则版） ============

def compute_anomaly_adjustments(
    candidates: List[Dict[str, Any]],
    input_bundle: InputBundle
) -> List[AdjustmentItem]:
    """
    L3 异常检测 - 检查异常行情
    
    规则（MVP 版本）：
    - 开板次数过多（>3）
    - 换手率异常高（>30%）
    - 量能急剧萎缩
    """
    adjustments = []
    
    for candidate in candidates:
        if candidate.get("action") != "ALLOW":
            continue
        
        symbol = candidate["symbol"]
        
        # 开板次数检查
        open_count = candidate.get("open_count", 0)
        if open_count > 3:
            adjustments.append(AdjustmentItem(
                symbol=symbol,
                to_action="WATCH",
                reason=f"开板次数过多 ({open_count} 次)，稳定性不足",
                source="anomaly_guard"
            ))
            continue
        
        # 换手率检查
        turnover_rate = candidate.get("turnover_rate", 0)
        if turnover_rate > 30:
            adjustments.append(AdjustmentItem(
                symbol=symbol,
                to_action="WATCH",
                reason=f"换手率异常 ({turnover_rate:.1f}%)，疑似游资出货",
                source="anomaly_guard"
            ))
            continue
        
        # 量能检查（需要历史数据）
        volume_ratio = candidate.get("volume_ratio", 1)
        if volume_ratio < 0.5:
            adjustments.append(AdjustmentItem(
                symbol=symbol,
                to_action="WATCH",
                reason=f"量能萎缩 (量比 {volume_ratio:.2f})，持续性存疑",
                source="anomaly_guard"
            ))
    
    return adjustments


# ============ 主入口函数 ============

def compute_risk_context(input_bundle: InputBundle) -> RiskContext:
    """
    计算完整风控上下文
    
    执行顺序：
    1. L0 硬闸门
    2. L2 市场状态识别
    3. L1 风险预算
    """
    # L0: 硬闸门
    hard_gate = compute_hard_gate(input_bundle)
    
    # L2: 市场状态
    regime = compute_market_regime(input_bundle)
    
    # L1: 风险预算
    risk_budget = compute_risk_budget(input_bundle)
    
    # 生成 input_hash
    input_str = str(input_bundle.model_dump())
    input_hash = hashlib.md5(input_str.encode()).hexdigest()[:16]
    
    return RiskContext(
        hard_gate=hard_gate,
        regime=regime,
        risk_budget=risk_budget,
        adjustments=AdjustmentsResult(),
        meta={
            "ts": datetime.utcnow().isoformat(),
            "version": "0.1.0",
            "input_hash": input_hash,
            "warnings": []
        }
    )


def apply_risk_to_aggregated(
    aggregated_result: List[Dict[str, Any]],
    risk_context: RiskContext,
    input_bundle: InputBundle
) -> List[Dict[str, Any]]:
    """
    将风控应用到聚合结果
    
    执行顺序：
    1. L3 暴露管理
    2. L3 异常检测
    3. 最终 Policy Gate（L0 兜底）
    """
    # 复制结果避免修改原数据
    result = [dict(item) for item in aggregated_result]
    adjustments = AdjustmentsResult()
    
    # L3: 暴露管理
    exposure_adj = compute_exposure_adjustments(
        input_bundle.portfolio,
        result,
        risk_context.risk_budget
    )
    adjustments.downgrades.extend([a for a in exposure_adj if a.to_action == "WATCH"])
    adjustments.blocks.extend([a for a in exposure_adj if a.to_action == "BLOCK"])
    
    # L3: 异常检测
    anomaly_adj = compute_anomaly_adjustments(result, input_bundle)
    adjustments.downgrades.extend([a for a in anomaly_adj if a.to_action == "WATCH"])
    adjustments.blocks.extend([a for a in anomaly_adj if a.to_action == "BLOCK"])
    
    # 应用调整
    adjustment_map = {}
    for adj in adjustments.downgrades + adjustments.blocks:
        if adj.symbol not in adjustment_map or adj.to_action == "BLOCK":
            adjustment_map[adj.symbol] = adj
    
    for item in result:
        symbol = item.get("symbol")
        
        # 应用 L3 调整
        if symbol in adjustment_map:
            adj = adjustment_map[symbol]
            if item.get("action") == "ALLOW":
                item["action"] = adj.to_action
                item["downgrade_reason"] = adj.reason
                item["downgrade_source"] = adj.source
        
        # L0 最终兜底
        if not risk_context.hard_gate.allow_new_trades:
            if item.get("action") == "ALLOW":
                item["action"] = "BLOCK"
                item["blocked_reason"] = risk_context.hard_gate.blocked_reason
        
        # 置信度检查
        confidence = item.get("confidence", 0)
        if confidence < settings.confidence_min_allow and item.get("action") == "ALLOW":
            item["action"] = "WATCH"
            item["downgrade_reason"] = f"置信度不足 ({confidence:.2f} < {settings.confidence_min_allow})"
        
        # 仓位上限
        max_single = risk_context.risk_budget.max_single_position
        if item.get("suggested_position", 0) > max_single:
            item["suggested_position"] = max_single
            item["position_capped"] = True
    
    # 更新 risk_context 的 adjustments
    risk_context.adjustments = adjustments
    
    return result


def generate_decision_id() -> str:
    """生成风控决策 ID"""
    return f"rd_{uuid.uuid4().hex[:12]}"
