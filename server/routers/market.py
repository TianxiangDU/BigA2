"""
市场数据路由
"""
from fastapi import APIRouter, Query
from typing import Optional

from services.adata_service import (
    get_adata_service,
    StockQuote,
    StockInfo,
    MarketOverview,
)

router = APIRouter()


@router.get("/overview", response_model=MarketOverview)
async def get_market_overview():
    """获取市场概览"""
    service = get_adata_service()
    return await service.get_market_overview()


@router.get("/stocks", response_model=list[StockInfo])
async def get_stock_list(market: Optional[str] = Query(None, description="市场: SH, SZ, BJ")):
    """获取股票列表"""
    service = get_adata_service()
    return await service.get_stock_list(market)


@router.get("/quote/{symbol}", response_model=StockQuote)
async def get_stock_quote(symbol: str):
    """获取单个股票行情"""
    service = get_adata_service()
    quote = await service.get_quote(symbol)
    if quote is None:
        return {"error": "股票不存在或数据获取失败"}
    return quote


@router.post("/quotes", response_model=list[StockQuote])
async def get_batch_quotes(symbols: list[str]):
    """批量获取行情"""
    service = get_adata_service()
    return await service.get_batch_quotes(symbols)


@router.get("/limit-up", response_model=list[StockQuote])
async def get_limit_up_stocks():
    """获取涨停股列表"""
    service = get_adata_service()
    return await service.get_limit_up_stocks()


@router.get("/kline/{symbol}")
async def get_kline(
    symbol: str,
    start_date: str = Query(..., description="开始日期 YYYY-MM-DD"),
    end_date: str = Query("", description="结束日期 YYYY-MM-DD"),
):
    """获取K线数据"""
    service = get_adata_service()
    return await service.get_kline(symbol, start_date, end_date)
