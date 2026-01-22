"""
复盘路由
"""
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import uuid

from database import get_db, Outcome, Alert


router = APIRouter()


class OutcomeCreate(BaseModel):
    alert_id: str
    label: str  # SUCCESS, FAIL, SKIP
    pnl: Optional[float] = None
    notes: Optional[str] = None
    root_causes: Optional[list[str]] = None
    suggestions: Optional[list[str]] = None


class OutcomeResponse(BaseModel):
    outcome_id: str
    alert_id: str
    label: str
    pnl: Optional[float]
    notes: Optional[str]
    summary: Optional[str]
    created_at: datetime


@router.get("/outcomes", response_model=list[OutcomeResponse])
async def list_outcomes(
    label: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取复盘结果列表"""
    query = select(Outcome)
    
    if label:
        query = query.where(Outcome.label == label)
    if start_date:
        query = query.where(Outcome.created_at >= start_date)
    if end_date:
        query = query.where(Outcome.created_at <= end_date)
    
    query = query.order_by(Outcome.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/outcomes", response_model=OutcomeResponse)
async def create_outcome(outcome: OutcomeCreate, db: AsyncSession = Depends(get_db)):
    """创建复盘记录"""
    outcome_id = f"OUT{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6]}"
    
    # 生成总结
    summary = f"交易结果: {outcome.label}"
    if outcome.pnl is not None:
        summary += f", 盈亏: {outcome.pnl:.2f}"
    if outcome.root_causes:
        summary += f", 原因: {', '.join(outcome.root_causes)}"
    
    db_outcome = Outcome(
        outcome_id=outcome_id,
        alert_id=outcome.alert_id,
        label=outcome.label,
        pnl=outcome.pnl,
        notes=outcome.notes,
        root_causes_json=outcome.root_causes,
        suggestions_json=outcome.suggestions,
        summary=summary,
    )
    db.add(db_outcome)
    await db.commit()
    await db.refresh(db_outcome)
    return db_outcome


@router.get("/stats")
async def get_review_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取复盘统计"""
    query = select(Outcome)
    if start_date:
        query = query.where(Outcome.created_at >= start_date)
    if end_date:
        query = query.where(Outcome.created_at <= end_date)
    
    result = await db.execute(query)
    outcomes = result.scalars().all()
    
    total = len(outcomes)
    success = sum(1 for o in outcomes if o.label == "SUCCESS")
    fail = sum(1 for o in outcomes if o.label == "FAIL")
    skip = sum(1 for o in outcomes if o.label == "SKIP")
    total_pnl = sum(o.pnl or 0 for o in outcomes)
    
    # 统计失败原因
    fail_reasons = {}
    for o in outcomes:
        if o.label == "FAIL" and o.root_causes_json:
            for cause in o.root_causes_json:
                fail_reasons[cause] = fail_reasons.get(cause, 0) + 1
    
    return {
        "total": total,
        "success": success,
        "fail": fail,
        "skip": skip,
        "win_rate": success / (success + fail) * 100 if (success + fail) > 0 else 0,
        "total_pnl": total_pnl,
        "avg_pnl": total_pnl / total if total > 0 else 0,
        "top_fail_reasons": sorted(fail_reasons.items(), key=lambda x: x[1], reverse=True)[:5],
    }
