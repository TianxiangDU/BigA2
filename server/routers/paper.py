"""
模拟盘路由
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
import uuid

from database import get_db, PaperOrder, PaperPosition, PaperTrade
from services.adata_service import get_adata_service


router = APIRouter()


# ============ 订单 ============
class OrderCreate(BaseModel):
    symbol: str
    name: Optional[str] = None
    side: str  # buy, sell
    qty: int
    price: float
    alert_id: Optional[str] = None
    strategy_id: Optional[str] = None
    group_id: Optional[str] = None


class OrderResponse(BaseModel):
    order_id: str
    symbol: str
    name: Optional[str]
    side: str
    qty: int
    price: float
    status: str
    alert_id: Optional[str]
    strategy_id: Optional[str]
    created_at: datetime


@router.get("/orders", response_model=list[OrderResponse])
async def list_orders(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取订单列表"""
    query = select(PaperOrder)
    if status:
        query = query.where(PaperOrder.status == status)
    query = query.order_by(PaperOrder.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, db: AsyncSession = Depends(get_db)):
    """创建订单"""
    order_id = f"O{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4]}"
    
    db_order = PaperOrder(
        order_id=order_id,
        symbol=order.symbol,
        name=order.name,
        side=order.side,
        qty=order.qty,
        price=order.price,
        alert_id=order.alert_id,
        strategy_id=order.strategy_id,
        group_id=order.group_id,
    )
    db.add(db_order)
    await db.commit()
    await db.refresh(db_order)
    return db_order


@router.post("/orders/{order_id}/fill")
async def fill_order(order_id: str, db: AsyncSession = Depends(get_db)):
    """成交订单"""
    result = await db.execute(
        select(PaperOrder).where(PaperOrder.order_id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="订单状态不允许成交")
    
    # 更新订单状态
    order.status = "filled"
    order.filled_at = datetime.utcnow()
    
    # 更新持仓
    pos_result = await db.execute(
        select(PaperPosition).where(PaperPosition.symbol == order.symbol)
    )
    position = pos_result.scalar_one_or_none()
    
    pnl = 0.0
    if order.side == "buy":
        if position:
            # 加仓
            total_qty = position.qty + order.qty
            total_cost = position.avg_cost * position.qty + order.price * order.qty
            position.avg_cost = total_cost / total_qty
            position.qty = total_qty
        else:
            # 新建仓
            position = PaperPosition(
                symbol=order.symbol,
                name=order.name,
                qty=order.qty,
                avg_cost=order.price,
                current_price=order.price,
            )
            db.add(position)
    else:  # sell
        if not position or position.qty < order.qty:
            raise HTTPException(status_code=400, detail="持仓不足")
        
        # 计算盈亏
        pnl = (order.price - position.avg_cost) * order.qty
        position.qty -= order.qty
        
        if position.qty == 0:
            await db.delete(position)
    
    # 创建成交记录
    trade = PaperTrade(
        trade_id=f"T{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4]}",
        order_id=order_id,
        symbol=order.symbol,
        side=order.side,
        fill_qty=order.qty,
        fill_price=order.price,
        pnl=pnl,
        strategy_id=order.strategy_id,
        group_id=order.group_id,
        alert_id=order.alert_id,
    )
    db.add(trade)
    
    await db.commit()
    
    return {
        "status": "ok",
        "order_id": order_id,
        "pnl": pnl,
    }


# ============ 持仓 ============
class PositionResponse(BaseModel):
    symbol: str
    name: Optional[str]
    qty: int
    avg_cost: float
    current_price: Optional[float]
    unrealized_pnl: float
    pnl_pct: float


@router.get("/positions", response_model=list[PositionResponse])
async def list_positions(db: AsyncSession = Depends(get_db)):
    """获取持仓列表"""
    result = await db.execute(
        select(PaperPosition).where(PaperPosition.qty > 0)
    )
    positions = result.scalars().all()
    
    # 更新当前价格
    service = get_adata_service()
    response = []
    for pos in positions:
        quote = await service.get_quote(pos.symbol)
        current_price = quote.price if quote else pos.current_price or pos.avg_cost
        unrealized_pnl = (current_price - pos.avg_cost) * pos.qty
        pnl_pct = (current_price - pos.avg_cost) / pos.avg_cost * 100 if pos.avg_cost > 0 else 0
        
        response.append(PositionResponse(
            symbol=pos.symbol,
            name=pos.name,
            qty=pos.qty,
            avg_cost=pos.avg_cost,
            current_price=current_price,
            unrealized_pnl=unrealized_pnl,
            pnl_pct=pnl_pct,
        ))
    
    return response


# ============ 成交 ============
@router.get("/trades")
async def list_trades(
    strategy_id: Optional[str] = None,
    group_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取成交列表"""
    query = select(PaperTrade)
    if strategy_id:
        query = query.where(PaperTrade.strategy_id == strategy_id)
    if group_id:
        query = query.where(PaperTrade.group_id == group_id)
    query = query.order_by(PaperTrade.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


# ============ 统计 ============
@router.get("/stats")
async def get_paper_stats(db: AsyncSession = Depends(get_db)):
    """获取模拟盘统计"""
    # 总盈亏
    pnl_result = await db.execute(
        select(func.sum(PaperTrade.pnl))
    )
    total_pnl = pnl_result.scalar() or 0
    
    # 成交数
    trade_count = await db.execute(select(func.count(PaperTrade.id)))
    
    # 胜率
    win_count = await db.execute(
        select(func.count(PaperTrade.id)).where(PaperTrade.pnl > 0)
    )
    
    total = trade_count.scalar() or 0
    wins = win_count.scalar() or 0
    win_rate = wins / total * 100 if total > 0 else 0
    
    # 持仓市值
    positions = await db.execute(select(PaperPosition).where(PaperPosition.qty > 0))
    market_value = sum(
        (p.current_price or p.avg_cost) * p.qty 
        for p in positions.scalars()
    )
    
    return {
        "total_pnl": total_pnl,
        "trade_count": total,
        "win_rate": win_rate,
        "market_value": market_value,
    }
