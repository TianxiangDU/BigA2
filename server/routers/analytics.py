"""
统计分析路由 - 多维度归因分析
"""
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from database import (
    get_db, PaperTrade, PaperOrder, StrategyRun, StrategyGroup, 
    StrategyCard, Alert, Outcome
)


router = APIRouter()


# ============ 响应模型 ============

class PerformanceStats(BaseModel):
    """绩效统计"""
    id: str
    name: str
    trade_count: int
    win_count: int
    lose_count: int
    win_rate: float
    total_pnl: float
    avg_pnl: float
    max_pnl: float
    min_pnl: float
    max_drawdown: float = 0
    sharpe_ratio: float = 0
    
    # 拦截统计
    blocked_count: int = 0
    block_rate: float = 0


class AnalyticsSummary(BaseModel):
    """统计摘要"""
    total_trades: int
    total_pnl: float
    overall_win_rate: float
    best_strategy: Optional[str]
    worst_strategy: Optional[str]
    avg_holding_days: float = 0
    total_blocked: int = 0


def calculate_stats(trades: list, id_field: str, name_map: dict = None) -> List[PerformanceStats]:
    """通用统计计算"""
    stats_map = {}
    
    for trade in trades:
        sid = getattr(trade, id_field) or "unknown"
        if sid not in stats_map:
            stats_map[sid] = {
                "id": sid,
                "name": name_map.get(sid, sid) if name_map else sid,
                "trade_count": 0,
                "win_count": 0,
                "lose_count": 0,
                "total_pnl": 0,
                "pnl_list": [],
                "max_pnl": float('-inf'),
                "min_pnl": float('inf'),
            }
        
        stats = stats_map[sid]
        stats["trade_count"] += 1
        pnl = trade.pnl or 0
        stats["total_pnl"] += pnl
        stats["pnl_list"].append(pnl)
        
        if pnl > 0:
            stats["win_count"] += 1
        elif pnl < 0:
            stats["lose_count"] += 1
        
        stats["max_pnl"] = max(stats["max_pnl"], pnl)
        stats["min_pnl"] = min(stats["min_pnl"], pnl)
    
    result = []
    for sid, stats in stats_map.items():
        tc = stats["trade_count"]
        
        # 计算最大回撤
        pnl_list = stats["pnl_list"]
        max_drawdown = 0
        if pnl_list:
            cumsum = 0
            peak = 0
            for p in pnl_list:
                cumsum += p
                peak = max(peak, cumsum)
                drawdown = peak - cumsum
                max_drawdown = max(max_drawdown, drawdown)
        
        result.append(PerformanceStats(
            id=sid,
            name=stats["name"],
            trade_count=tc,
            win_count=stats["win_count"],
            lose_count=stats["lose_count"],
            win_rate=stats["win_count"] / tc * 100 if tc > 0 else 0,
            total_pnl=stats["total_pnl"],
            avg_pnl=stats["total_pnl"] / tc if tc > 0 else 0,
            max_pnl=stats["max_pnl"] if stats["max_pnl"] != float('-inf') else 0,
            min_pnl=stats["min_pnl"] if stats["min_pnl"] != float('inf') else 0,
            max_drawdown=max_drawdown,
        ))
    
    return sorted(result, key=lambda x: x.total_pnl, reverse=True)


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取统计摘要"""
    query = select(PaperTrade)
    if start_date:
        query = query.where(PaperTrade.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(PaperTrade.created_at <= datetime.combine(end_date, datetime.max.time()))
    
    result = await db.execute(query)
    trades = result.scalars().all()
    
    if not trades:
        return AnalyticsSummary(
            total_trades=0,
            total_pnl=0,
            overall_win_rate=0,
            best_strategy=None,
            worst_strategy=None,
        )
    
    total_pnl = sum(t.pnl or 0 for t in trades)
    win_count = sum(1 for t in trades if (t.pnl or 0) > 0)
    
    # 找最佳和最差策略
    strategy_pnl = {}
    for t in trades:
        sid = t.strategy_id or "unknown"
        strategy_pnl[sid] = strategy_pnl.get(sid, 0) + (t.pnl or 0)
    
    best = max(strategy_pnl.items(), key=lambda x: x[1]) if strategy_pnl else (None, 0)
    worst = min(strategy_pnl.items(), key=lambda x: x[1]) if strategy_pnl else (None, 0)
    
    # 获取被拦截的数量
    blocked_result = await db.execute(
        select(func.count(Alert.id)).where(Alert.final_action == "BLOCK")
    )
    blocked_count = blocked_result.scalar() or 0
    
    return AnalyticsSummary(
        total_trades=len(trades),
        total_pnl=total_pnl,
        overall_win_rate=win_count / len(trades) * 100 if trades else 0,
        best_strategy=best[0],
        worst_strategy=worst[0],
        total_blocked=blocked_count,
    )


@router.get("/by-strategy", response_model=List[PerformanceStats])
async def get_strategy_performance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """按策略统计绩效"""
    query = select(PaperTrade).where(PaperTrade.strategy_id.isnot(None))
    if start_date:
        query = query.where(PaperTrade.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(PaperTrade.created_at <= datetime.combine(end_date, datetime.max.time()))
    
    result = await db.execute(query)
    trades = result.scalars().all()
    
    # 获取策略名称映射
    cards = await db.execute(select(StrategyCard))
    name_map = {c.strategy_id: c.name for c in cards.scalars().all()}
    
    return calculate_stats(trades, "strategy_id", name_map)


@router.get("/by-group", response_model=List[PerformanceStats])
async def get_group_performance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """按策略组统计绩效"""
    query = select(PaperTrade).where(PaperTrade.group_id.isnot(None))
    if start_date:
        query = query.where(PaperTrade.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(PaperTrade.created_at <= datetime.combine(end_date, datetime.max.time()))
    
    result = await db.execute(query)
    trades = result.scalars().all()
    
    # 获取策略组名称映射
    groups = await db.execute(select(StrategyGroup))
    name_map = {g.group_id: g.name for g in groups.scalars().all()}
    
    return calculate_stats(trades, "group_id", name_map)


@router.get("/by-regime")
async def get_regime_performance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    按市场状态(regime)统计绩效
    
    根据交易时的市场情绪分类统计
    """
    query = select(PaperTrade, Alert).join(
        Alert, PaperTrade.alert_id == Alert.alert_id, isouter=True
    )
    if start_date:
        query = query.where(PaperTrade.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(PaperTrade.created_at <= datetime.combine(end_date, datetime.max.time()))
    
    result = await db.execute(query)
    rows = result.all()
    
    # 按 regime 分组
    regime_stats = {
        "bullish": {"name": "牛市/强势", "trade_count": 0, "win_count": 0, "total_pnl": 0},
        "bearish": {"name": "熊市/弱势", "trade_count": 0, "win_count": 0, "total_pnl": 0},
        "neutral": {"name": "震荡/中性", "trade_count": 0, "win_count": 0, "total_pnl": 0},
        "unknown": {"name": "未知", "trade_count": 0, "win_count": 0, "total_pnl": 0},
    }
    
    for trade, alert in rows:
        # 从 alert 的 signal_card_json 中提取 regime
        regime = "unknown"
        if alert and alert.signal_card_json:
            regime = alert.signal_card_json.get("market_regime", "unknown")
            if regime not in regime_stats:
                regime = "unknown"
        
        stats = regime_stats[regime]
        stats["trade_count"] += 1
        stats["total_pnl"] += trade.pnl or 0
        if trade.pnl and trade.pnl > 0:
            stats["win_count"] += 1
    
    result_list = []
    for regime, stats in regime_stats.items():
        if stats["trade_count"] > 0:
            result_list.append({
                "regime": regime,
                "name": stats["name"],
                "trade_count": stats["trade_count"],
                "win_count": stats["win_count"],
                "win_rate": stats["win_count"] / stats["trade_count"] * 100,
                "total_pnl": stats["total_pnl"],
                "avg_pnl": stats["total_pnl"] / stats["trade_count"],
            })
    
    return result_list


@router.get("/blocked-stats")
async def get_blocked_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    获取拦截统计
    
    分析被 Policy Gate 拦截的信号情况
    """
    query = select(Alert)
    if start_date:
        query = query.where(Alert.ts >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(Alert.ts <= datetime.combine(end_date, datetime.max.time()))
    
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    total = len(alerts)
    blocked = [a for a in alerts if a.final_action == "BLOCK"]
    watched = [a for a in alerts if a.final_action == "WATCH"]
    allowed = [a for a in alerts if a.final_action == "ALLOW"]
    
    # 分析拦截原因
    block_reasons = {}
    for alert in blocked:
        if alert.policy_decision_json:
            reason = alert.policy_decision_json.get("reason", "未知原因")
            block_reasons[reason] = block_reasons.get(reason, 0) + 1
    
    return {
        "total_signals": total,
        "blocked_count": len(blocked),
        "blocked_rate": len(blocked) / total * 100 if total > 0 else 0,
        "watched_count": len(watched),
        "allowed_count": len(allowed),
        "block_reasons": [
            {"reason": r, "count": c}
            for r, c in sorted(block_reasons.items(), key=lambda x: -x[1])
        ],
    }


@router.get("/daily-pnl")
async def get_daily_pnl(
    days: int = Query(30, description="统计天数"),
    db: AsyncSession = Depends(get_db)
):
    """获取每日盈亏曲线"""
    start = datetime.now() - timedelta(days=days)
    
    result = await db.execute(
        select(PaperTrade).where(PaperTrade.created_at >= start)
    )
    trades = result.scalars().all()
    
    # 按日期分组
    daily = {}
    for trade in trades:
        day = trade.created_at.strftime("%Y-%m-%d")
        if day not in daily:
            daily[day] = {"date": day, "pnl": 0, "trade_count": 0}
        daily[day]["pnl"] += trade.pnl or 0
        daily[day]["trade_count"] += 1
    
    # 计算累计盈亏
    sorted_days = sorted(daily.values(), key=lambda x: x["date"])
    cumulative = 0
    for d in sorted_days:
        cumulative += d["pnl"]
        d["cumulative_pnl"] = cumulative
    
    return sorted_days


@router.get("/attribution")
async def get_attribution(
    alert_id: Optional[str] = None,
    strategy_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取归因分析"""
    query = select(PaperTrade)
    if alert_id:
        query = query.where(PaperTrade.alert_id == alert_id)
    if strategy_id:
        query = query.where(PaperTrade.strategy_id == strategy_id)
    
    result = await db.execute(query)
    trades = result.scalars().all()
    
    # 归因统计
    attribution = {
        "by_strategy": {},
        "by_group": {},
        "by_alert": {},
    }
    
    for trade in trades:
        # 按策略
        if trade.strategy_id:
            if trade.strategy_id not in attribution["by_strategy"]:
                attribution["by_strategy"][trade.strategy_id] = {"pnl": 0, "count": 0}
            attribution["by_strategy"][trade.strategy_id]["pnl"] += trade.pnl or 0
            attribution["by_strategy"][trade.strategy_id]["count"] += 1
        
        # 按组
        if trade.group_id:
            if trade.group_id not in attribution["by_group"]:
                attribution["by_group"][trade.group_id] = {"pnl": 0, "count": 0}
            attribution["by_group"][trade.group_id]["pnl"] += trade.pnl or 0
            attribution["by_group"][trade.group_id]["count"] += 1
        
        # 按提示
        if trade.alert_id:
            if trade.alert_id not in attribution["by_alert"]:
                attribution["by_alert"][trade.alert_id] = {"pnl": 0, "count": 0}
            attribution["by_alert"][trade.alert_id]["pnl"] += trade.pnl or 0
            attribution["by_alert"][trade.alert_id]["count"] += 1
    
    return attribution
