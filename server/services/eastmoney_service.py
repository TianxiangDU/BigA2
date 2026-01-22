"""
东方财富数据服务 - 直接请求 API，绕过代理问题
"""
import httpx
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import asyncio


class IndexQuote(BaseModel):
    """指数行情"""
    code: str
    name: str
    price: float
    change: float
    change_pct: float
    open: float
    high: float
    low: float
    pre_close: float
    volume: int
    amount: float
    update_time: str


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
    turnover_rate: float = 0
    update_time: str


class MarketSentiment(BaseModel):
    """市场情绪数据"""
    limit_up_count: int
    limit_down_count: int
    up_count: int
    down_count: int
    flat_count: int
    rush_count: int
    bomb_count: int
    bomb_rate: float
    max_streak: int
    sentiment: str
    total_amount: float
    update_time: str


# 主要指数代码和名称
MAIN_INDICES = [
    ("1.000001", "上证"),
    ("0.399001", "深证"),
    ("0.399006", "创业板"),
    ("1.000688", "科创"),
    ("1.000300", "沪深300"),
    ("1.000016", "上证50"),
]


class EastMoneyService:
    """东方财富数据服务"""
    
    def __init__(self):
        self._client = httpx.AsyncClient(
            timeout=10.0,
            trust_env=False,  # 关键：忽略代理环境变量
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Referer": "https://quote.eastmoney.com/",
            }
        )
        self._stock_cache: list[dict] = []
        self._last_update: Optional[datetime] = None
        self._cache_seconds = 5
    
    def _is_cache_valid(self) -> bool:
        if self._last_update is None:
            return False
        return (datetime.now() - self._last_update).total_seconds() < self._cache_seconds
    
    async def get_indices(self) -> list[IndexQuote]:
        """获取主要指数行情"""
        indices = []
        
        for code, name in MAIN_INDICES:
            try:
                # 东方财富实时行情 API
                url = f"https://push2.eastmoney.com/api/qt/stock/get"
                params = {
                    "secid": code,
                    "fields": "f43,f44,f45,f46,f47,f48,f57,f58,f60,f169,f170",
                    "ut": "fa5fd1943c7b386f172d6893dbfba10b",
                }
                
                resp = await self._client.get(url, params=params)
                data = resp.json()
                
                if data.get("data"):
                    d = data["data"]
                    indices.append(IndexQuote(
                        code=code.split(".")[1],
                        name=name,
                        price=d.get("f43", 0) / 100 if d.get("f43") else 0,
                        change=d.get("f169", 0) / 100 if d.get("f169") else 0,
                        change_pct=d.get("f170", 0) / 100 if d.get("f170") else 0,
                        open=d.get("f46", 0) / 100 if d.get("f46") else 0,
                        high=d.get("f44", 0) / 100 if d.get("f44") else 0,
                        low=d.get("f45", 0) / 100 if d.get("f45") else 0,
                        pre_close=d.get("f60", 0) / 100 if d.get("f60") else 0,
                        volume=d.get("f47", 0) or 0,
                        amount=d.get("f48", 0) or 0,
                        update_time=datetime.now().strftime("%H:%M:%S"),
                    ))
            except Exception as e:
                print(f"获取指数 {name} 失败: {e}")
        
        return indices
    
    async def _fetch_all_stocks(self) -> list[dict]:
        """获取全部A股行情数据"""
        all_stocks = []
        try:
            # 分别获取沪深主板、创业板、科创板
            markets = [
                "m:0+t:6,m:0+t:80",  # 深主板
                "m:1+t:2,m:1+t:23",  # 沪主板
                "m:0+t:81+s:2048",   # 创业板
                "m:1+t:23+s:2048",   # 科创板
            ]
            
            for fs in markets:
                url = "https://push2.eastmoney.com/api/qt/clist/get"
                params = {
                    "pn": 1,
                    "pz": 5000,
                    "po": 1,
                    "np": 1,
                    "ut": "bd1d9ddb04089700cf9c27f6f7426281",
                    "fltt": 2,
                    "invt": 2,
                    "fid": "f3",
                    "fs": fs,
                    "fields": "f2,f3,f4,f5,f6,f7,f8,f12,f14,f15,f16,f17,f18",
                }
                
                resp = await self._client.get(url, params=params)
                data = resp.json()
                
                if data.get("data") and data["data"].get("diff"):
                    all_stocks.extend(data["data"]["diff"])
            
            return all_stocks
        except Exception as e:
            print(f"获取股票行情失败: {e}")
            return []
    
    async def refresh_stocks(self):
        """刷新股票数据"""
        try:
            self._stock_cache = await self._fetch_all_stocks()
            self._last_update = datetime.now()
            print(f"刷新完成，共 {len(self._stock_cache)} 只股票")
        except Exception as e:
            print(f"刷新股票数据失败: {e}")
    
    async def get_sentiment(self) -> MarketSentiment:
        """获取市场情绪"""
        if not self._is_cache_valid():
            await self.refresh_stocks()
        
        if not self._stock_cache:
            return self._empty_sentiment()
        
        stocks = self._stock_cache
        
        up_count = sum(1 for s in stocks if (s.get("f3") or 0) > 0)
        down_count = sum(1 for s in stocks if (s.get("f3") or 0) < 0)
        flat_count = sum(1 for s in stocks if (s.get("f3") or 0) == 0)
        
        # 涨停/跌停
        limit_up_count = sum(1 for s in stocks if (s.get("f3") or 0) >= 9.9)
        limit_down_count = sum(1 for s in stocks if (s.get("f3") or 0) <= -9.9)
        
        # 冲板/炸板
        rush_count = 0
        bomb_count = 0
        for s in stocks:
            high = s.get("f15") or 0
            pre_close = s.get("f18") or 0
            change_pct = s.get("f3") or 0
            
            if pre_close > 0:
                high_pct = (high - pre_close) / pre_close * 100
                if high_pct >= 9.9:
                    rush_count += 1
                    if change_pct < 9.9:
                        bomb_count += 1
        
        bomb_rate = (bomb_count / rush_count * 100) if rush_count > 0 else 0
        total_amount = sum(s.get("f6") or 0 for s in stocks)
        
        sentiment = self._calculate_sentiment(
            limit_up_count, limit_down_count, up_count, down_count, bomb_rate
        )
        
        return MarketSentiment(
            limit_up_count=limit_up_count,
            limit_down_count=limit_down_count,
            up_count=up_count,
            down_count=down_count,
            flat_count=flat_count,
            rush_count=rush_count,
            bomb_count=bomb_count,
            bomb_rate=round(bomb_rate, 2),
            max_streak=0,
            sentiment=sentiment,
            total_amount=total_amount,
            update_time=datetime.now().strftime("%H:%M:%S"),
        )
    
    async def get_limit_up_stocks(self) -> list[StockQuote]:
        """获取涨停股列表"""
        if not self._is_cache_valid():
            await self.refresh_stocks()
        
        if not self._stock_cache:
            return []
        
        # 筛选涨停股并按成交额排序
        limit_up = [s for s in self._stock_cache if (s.get("f3") or 0) >= 9.9]
        limit_up.sort(key=lambda x: x.get("f6") or 0, reverse=True)
        
        stocks = []
        for s in limit_up[:50]:
            stocks.append(StockQuote(
                symbol=str(s.get("f12", "")),
                name=str(s.get("f14", "")),
                price=float(s.get("f2") or 0),
                change=float(s.get("f4") or 0),
                change_pct=float(s.get("f3") or 0),
                volume=int(s.get("f5") or 0),
                amount=float(s.get("f6") or 0),
                open=float(s.get("f17") or 0),
                high=float(s.get("f15") or 0),
                low=float(s.get("f16") or 0),
                pre_close=float(s.get("f18") or 0),
                turnover_rate=float(s.get("f8") or 0),
                update_time=datetime.now().strftime("%H:%M:%S"),
            ))
        
        return stocks
    
    async def get_stock_quote(self, symbol: str) -> Optional[StockQuote]:
        """获取单个股票行情"""
        if not self._is_cache_valid():
            await self.refresh_stocks()
        
        for s in self._stock_cache:
            if str(s.get("f12")) == symbol:
                return StockQuote(
                    symbol=str(s.get("f12", "")),
                    name=str(s.get("f14", "")),
                    price=float(s.get("f2") or 0),
                    change=float(s.get("f4") or 0),
                    change_pct=float(s.get("f3") or 0),
                    volume=int(s.get("f5") or 0),
                    amount=float(s.get("f6") or 0),
                    open=float(s.get("f17") or 0),
                    high=float(s.get("f15") or 0),
                    low=float(s.get("f16") or 0),
                    pre_close=float(s.get("f18") or 0),
                    turnover_rate=float(s.get("f8") or 0),
                    update_time=datetime.now().strftime("%H:%M:%S"),
                )
        return None
    
    async def get_market_overview(self):
        """获取市场概览"""
        sentiment = await self.get_sentiment()
        return {
            "up_count": sentiment.up_count,
            "down_count": sentiment.down_count,
            "flat_count": sentiment.flat_count,
            "limit_up_count": sentiment.limit_up_count,
            "limit_down_count": sentiment.limit_down_count,
            "total_amount": sentiment.total_amount,
            "north_flow": 0,
            "update_time": sentiment.update_time,
        }
    
    def _calculate_sentiment(self, limit_up, limit_down, up, down, bomb_rate) -> str:
        score = 0
        ratio = up / down if down > 0 else 10
        
        if ratio > 2:
            score += 2
        elif ratio > 1.2:
            score += 1
        elif ratio < 0.5:
            score -= 2
        elif ratio < 0.8:
            score -= 1
        
        if limit_up >= 80:
            score += 2
        elif limit_up >= 50:
            score += 1
        elif limit_up < 20:
            score -= 1
        
        if bomb_rate < 10:
            score += 1
        elif bomb_rate > 25:
            score -= 1
        
        if score >= 3:
            return "偏强"
        elif score <= -1:
            return "偏弱"
        return "中性"
    
    def _empty_sentiment(self) -> MarketSentiment:
        return MarketSentiment(
            limit_up_count=0, limit_down_count=0, up_count=0, down_count=0,
            flat_count=0, rush_count=0, bomb_count=0, bomb_rate=0,
            max_streak=0, sentiment="--", total_amount=0,
            update_time=datetime.now().strftime("%H:%M:%S"),
        )


# 单例
_service: Optional[EastMoneyService] = None


def get_eastmoney_service() -> EastMoneyService:
    global _service
    if _service is None:
        _service = EastMoneyService()
    return _service
