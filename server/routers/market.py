"""
市场数据路由
"""
from fastapi import APIRouter
from typing import Optional

from services.eastmoney_service import (
    get_eastmoney_service,
    IndexQuote,
    StockQuote,
    MarketSentiment,
)

router = APIRouter()


@router.get("/overview")
async def get_market_overview():
    """获取市场概览"""
    service = get_eastmoney_service()
    return await service.get_market_overview()


@router.get("/indices", response_model=list[IndexQuote])
async def get_indices():
    """获取主要指数行情（上证、深证、创业板、科创、沪深300、上证50）"""
    service = get_eastmoney_service()
    return await service.get_indices()


@router.get("/sentiment", response_model=MarketSentiment)
async def get_sentiment():
    """获取市场情绪数据（涨停、跌停、冲板、炸板率、情绪等）"""
    service = get_eastmoney_service()
    return await service.get_sentiment()


@router.get("/quote/{symbol}", response_model=StockQuote)
async def get_stock_quote(symbol: str):
    """获取单个股票行情"""
    service = get_eastmoney_service()
    quote = await service.get_stock_quote(symbol)
    if quote is None:
        return {"error": "股票不存在或数据获取失败"}
    return quote


@router.get("/limit-up", response_model=list[StockQuote])
async def get_limit_up_stocks():
    """获取涨停股列表"""
    service = get_eastmoney_service()
    return await service.get_limit_up_stocks()


@router.post("/refresh")
async def refresh_data():
    """手动刷新数据"""
    service = get_eastmoney_service()
    await service.refresh_stocks()
    return {"status": "ok", "message": "数据已刷新"}
