"""
统计分析路由
"""
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from database import get_db, PaperTrade, StrategyRun, StrategyGroup


router = APIRouter()


@router.get("/strategy-performance")
async def get_strategy_performance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取策略表现"""
    query = select(PaperTrade)
    if start_date:
        query = query.where(PaperTrade.created_at >= start_date)
    if end_date:
        query = query.where(PaperTrade.created_at <= end_date)
    
    result = await db.execute(query)
    trades = result.scalars().all()
    
    # 按策略分组统计
    strategy_stats = {}
    for trade in trades:
        sid = trade.strategy_id or "unknown"
        if sid not in strategy_stats:
            strategy_stats[sid] = {
                "strategy_id": sid,
                "trade_count": 0,
                "win_count": 0,
                "total_pnl": 0,
                "max_pnl": 0,
                "min_pnl": 0,
            }
        
        stats = strategy_stats[sid]
        stats["trade_count"] += 1
        stats["total_pnl"] += trade.pnl or 0
        if trade.pnl and trade.pnl > 0:
            stats["win_count"] += 1
        if trade.pnl:
            stats["max_pnl"] = max(stats["max_pnl"], trade.pnl)
            stats["min_pnl"] = min(stats["min_pnl"], trade.pnl)
    
    # 计算胜率
    for stats in strategy_stats.values():
        stats["win_rate"] = (
            stats["win_count"] / stats["trade_count"] * 100 
            if stats["trade_count"] > 0 else 0
        )
        stats["avg_pnl"] = (
            stats["total_pnl"] / stats["trade_count"]
            if stats["trade_count"] > 0 else 0
        )
    
    return list(strategy_stats.values())


@router.get("/group-performance")
async def get_group_performance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取策略组表现"""
    query = select(PaperTrade).where(PaperTrade.group_id.isnot(None))
    if start_date:
        query = query.where(PaperTrade.created_at >= start_date)
    if end_date:
        query = query.where(PaperTrade.created_at <= end_date)
    
    result = await db.execute(query)
    trades = result.scalars().all()
    
    # 按组分组统计
    group_stats = {}
    for trade in trades:
        gid = trade.group_id
        if gid not in group_stats:
            group_stats[gid] = {
                "group_id": gid,
                "trade_count": 0,
                "win_count": 0,
                "total_pnl": 0,
            }
        
        stats = group_stats[gid]
        stats["trade_count"] += 1
        stats["total_pnl"] += trade.pnl or 0
        if trade.pnl and trade.pnl > 0:
            stats["win_count"] += 1
    
    # 计算胜率
    for stats in group_stats.values():
        stats["win_rate"] = (
            stats["win_count"] / stats["trade_count"] * 100 
            if stats["trade_count"] > 0 else 0
        )
    
    return list(group_stats.values())


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
