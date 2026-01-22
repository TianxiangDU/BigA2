"""
adata 数据服务 - A股真实行情数据接入
"""
import adata
from datetime import datetime, timedelta
from typing import Optional
import asyncio
from functools import lru_cache
from pydantic import BaseModel


class StockQuote(BaseModel):
    """股票行情"""
    symbol: str
    name: str
    price: float
    change: float
    change_pct: float
    volume: int
    amount: float
    open: float
    high: float
    low: float
    pre_close: float
    bid1: float = 0
    ask1: float = 0
    bid1_vol: int = 0
    ask1_vol: int = 0
    update_time: str


class StockInfo(BaseModel):
    """股票基本信息"""
    symbol: str
    name: str
    industry: str = ""
    market: str = ""  # SH, SZ, BJ
    list_date: str = ""


class MarketOverview(BaseModel):
    """市场概览"""
    up_count: int
    down_count: int
    flat_count: int
    limit_up_count: int
    limit_down_count: int
    total_amount: float
    north_flow: float = 0
    update_time: str


class AdataService:
    """adata 数据服务封装"""
    
    def __init__(self):
        self._quote_cache: dict[str, tuple[StockQuote, datetime]] = {}
        self._cache_ttl = timedelta(seconds=3)  # 行情缓存3秒
    
    async def get_stock_list(self, market: Optional[str] = None) -> list[StockInfo]:
        """获取股票列表"""
        try:
            df = adata.stock.info.all_code()
            if df is None or df.empty:
                return []
            
            stocks = []
            for _, row in df.iterrows():
                code = str(row.get("stock_code", ""))
                name = str(row.get("short_name", ""))
                
                # 过滤市场
                if code.startswith("6"):
                    mkt = "SH"
                elif code.startswith(("0", "3")):
                    mkt = "SZ"
                elif code.startswith(("4", "8")):
                    mkt = "BJ"
                else:
                    continue
                    
                if market and mkt != market:
                    continue
                
                stocks.append(StockInfo(
                    symbol=code,
                    name=name,
                    market=mkt,
                ))
            
            return stocks
        except Exception as e:
            print(f"获取股票列表失败: {e}")
            return []
    
    async def get_quote(self, symbol: str) -> Optional[StockQuote]:
        """获取单个股票行情"""
        # 检查缓存
        if symbol in self._quote_cache:
            quote, ts = self._quote_cache[symbol]
            if datetime.now() - ts < self._cache_ttl:
                return quote
        
        try:
            df = adata.stock.market.get_market(stock_code=symbol)
            if df is None or df.empty:
                return None
            
            row = df.iloc[0]
            quote = StockQuote(
                symbol=symbol,
                name=str(row.get("short_name", "")),
                price=float(row.get("trade_price", 0)),
                change=float(row.get("change", 0)),
                change_pct=float(row.get("change_pct", 0)),
                volume=int(row.get("trade_vol", 0)),
                amount=float(row.get("trade_amount", 0)),
                open=float(row.get("open_price", 0)),
                high=float(row.get("high_price", 0)),
                low=float(row.get("low_price", 0)),
                pre_close=float(row.get("pre_close_price", 0)),
                update_time=datetime.now().strftime("%H:%M:%S"),
            )
            
            self._quote_cache[symbol] = (quote, datetime.now())
            return quote
        except Exception as e:
            print(f"获取行情失败 {symbol}: {e}")
            return None
    
    async def get_batch_quotes(self, symbols: list[str]) -> list[StockQuote]:
        """批量获取行情"""
        tasks = [self.get_quote(s) for s in symbols]
        results = await asyncio.gather(*tasks)
        return [q for q in results if q is not None]
    
    async def get_market_overview(self) -> MarketOverview:
        """获取市场概览"""
        try:
            df = adata.stock.market.get_market_real_time()
            if df is None or df.empty:
                return MarketOverview(
                    up_count=0, down_count=0, flat_count=0,
                    limit_up_count=0, limit_down_count=0,
                    total_amount=0, update_time=datetime.now().strftime("%H:%M:%S")
                )
            
            up_count = 0
            down_count = 0
            flat_count = 0
            limit_up_count = 0
            limit_down_count = 0
            total_amount = 0.0
            
            for _, row in df.iterrows():
                change_pct = float(row.get("change_pct", 0))
                amount = float(row.get("trade_amount", 0))
                total_amount += amount
                
                if change_pct > 0:
                    up_count += 1
                    if change_pct >= 9.9:
                        limit_up_count += 1
                elif change_pct < 0:
                    down_count += 1
                    if change_pct <= -9.9:
                        limit_down_count += 1
                else:
                    flat_count += 1
            
            return MarketOverview(
                up_count=up_count,
                down_count=down_count,
                flat_count=flat_count,
                limit_up_count=limit_up_count,
                limit_down_count=limit_down_count,
                total_amount=total_amount,
                update_time=datetime.now().strftime("%H:%M:%S"),
            )
        except Exception as e:
            print(f"获取市场概览失败: {e}")
            return MarketOverview(
                up_count=0, down_count=0, flat_count=0,
                limit_up_count=0, limit_down_count=0,
                total_amount=0, update_time=datetime.now().strftime("%H:%M:%S")
            )
    
    async def get_limit_up_stocks(self) -> list[StockQuote]:
        """获取涨停股列表"""
        try:
            df = adata.stock.market.get_market_real_time()
            if df is None or df.empty:
                return []
            
            limit_up = []
            for _, row in df.iterrows():
                change_pct = float(row.get("change_pct", 0))
                if change_pct >= 9.9:
                    limit_up.append(StockQuote(
                        symbol=str(row.get("stock_code", "")),
                        name=str(row.get("short_name", "")),
                        price=float(row.get("trade_price", 0)),
                        change=float(row.get("change", 0)),
                        change_pct=change_pct,
                        volume=int(row.get("trade_vol", 0)),
                        amount=float(row.get("trade_amount", 0)),
                        open=float(row.get("open_price", 0)),
                        high=float(row.get("high_price", 0)),
                        low=float(row.get("low_price", 0)),
                        pre_close=float(row.get("pre_close_price", 0)),
                        update_time=datetime.now().strftime("%H:%M:%S"),
                    ))
            
            return sorted(limit_up, key=lambda x: x.amount, reverse=True)
        except Exception as e:
            print(f"获取涨停股失败: {e}")
            return []
    
    async def get_kline(
        self, 
        symbol: str, 
        start_date: str,
        end_date: str = "",
        period: str = "day"
    ) -> list[dict]:
        """获取K线数据"""
        try:
            if not end_date:
                end_date = datetime.now().strftime("%Y-%m-%d")
            
            df = adata.stock.market.get_market_min(
                stock_code=symbol,
                start_date=start_date,
                end_date=end_date,
            )
            
            if df is None or df.empty:
                return []
            
            klines = []
            for _, row in df.iterrows():
                klines.append({
                    "date": str(row.get("trade_date", "")),
                    "open": float(row.get("open_price", 0)),
                    "high": float(row.get("high_price", 0)),
                    "low": float(row.get("low_price", 0)),
                    "close": float(row.get("close_price", 0)),
                    "volume": int(row.get("trade_vol", 0)),
                    "amount": float(row.get("trade_amount", 0)),
                })
            
            return klines
        except Exception as e:
            print(f"获取K线失败 {symbol}: {e}")
            return []


# 单例
_adata_service: Optional[AdataService] = None


def get_adata_service() -> AdataService:
    global _adata_service
    if _adata_service is None:
        _adata_service = AdataService()
    return _adata_service
