"""
东方财富数据服务 - 使用 akshare 和 httpx 获取数据
"""
import os
# 禁用代理
os.environ['NO_PROXY'] = '*'
os.environ['no_proxy'] = '*'
for k in list(os.environ.keys()):
    if 'proxy' in k.lower():
        del os.environ[k]

import httpx
import akshare as ak
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import pandas as pd


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
    first_limit_time: str = ""  # 首次涨停/跌停时间
    last_limit_time: str = ""   # 最后涨停/跌停时间
    open_times: int = 0         # 炸板次数
    streak_days: int = 0        # 连板天数
    industry: str = ""          # 所属行业
    update_time: str = ""


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


# 主要指数
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
            timeout=15.0,
            trust_env=False,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Referer": "https://quote.eastmoney.com/",
            }
        )
        self._limit_up_cache: list[StockQuote] = []
        self._limit_down_cache: list[StockQuote] = []
        self._sentiment_cache: Optional[MarketSentiment] = None
        self._last_update: Optional[datetime] = None
        self._cache_seconds = 60  # 缓存60秒
    
    def _is_cache_valid(self) -> bool:
        if self._last_update is None:
            return False
        return (datetime.now() - self._last_update).total_seconds() < self._cache_seconds
    
    async def get_indices(self) -> list[IndexQuote]:
        """获取主要指数行情"""
        indices = []
        
        for code, name in MAIN_INDICES:
            try:
                url = "https://push2.eastmoney.com/api/qt/stock/get"
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
    
    async def refresh_limit_data(self):
        """刷新涨跌停数据 - 使用 akshare"""
        today = datetime.now().strftime("%Y%m%d")
        
        # 获取涨停股
        try:
            df = ak.stock_zt_pool_em(date=today)
            self._limit_up_cache = self._parse_limit_stocks(df, is_up=True)
            print(f"涨停股刷新完成: {len(self._limit_up_cache)} 只")
        except Exception as e:
            print(f"获取涨停股失败: {e}")
            self._limit_up_cache = []
        
        # 获取跌停股
        try:
            df = ak.stock_zt_pool_dtgc_em(date=today)
            self._limit_down_cache = self._parse_limit_stocks(df, is_up=False)
            print(f"跌停股刷新完成: {len(self._limit_down_cache)} 只")
        except Exception as e:
            print(f"获取跌停股失败: {e}")
            self._limit_down_cache = []
        
        # 计算情绪数据
        await self._refresh_sentiment()
        
        self._last_update = datetime.now()
    
    def _parse_limit_stocks(self, df: pd.DataFrame, is_up: bool = True) -> list[StockQuote]:
        """解析涨跌停股票数据"""
        if df is None or df.empty:
            return []
        
        stocks = []
        for _, row in df.iterrows():
            try:
                symbol = str(row.get("代码", ""))
                stocks.append(StockQuote(
                    symbol=symbol,
                    name=str(row.get("名称", "")),
                    price=float(row.get("最新价", 0) or 0),
                    change=0,  # 涨跌额需要计算
                    change_pct=float(row.get("涨跌幅", 0) or 0),
                    volume=0,
                    amount=float(row.get("成交额", 0) or 0),
                    open=0,
                    high=0,
                    low=0,
                    pre_close=0,
                    turnover_rate=float(row.get("换手率", 0) or 0),
                    first_limit_time=str(row.get("首次封板时间", "") or row.get("首次跌停时间", "")),
                    last_limit_time=str(row.get("最后封板时间", "") or row.get("最后跌停时间", "")),
                    open_times=int(row.get("炸板次数", 0) or row.get("开板次数", 0) or 0),
                    streak_days=int(row.get("连板数", 0) or row.get("连续跌停", 0) or 0),
                    industry=str(row.get("所属行业", "")),
                    update_time=datetime.now().strftime("%H:%M:%S"),
                ))
            except Exception as e:
                print(f"解析股票数据失败: {e}")
        
        # 按成交额排序
        stocks.sort(key=lambda x: x.amount, reverse=True)
        return stocks
    
    async def _refresh_sentiment(self):
        """刷新市场情绪数据 - 基于涨跌停数据计算"""
        try:
            # 从涨停池获取数据
            limit_up_count = len(self._limit_up_cache)
            limit_down_count = len(self._limit_down_cache)
            
            # 冲板数和炸板数（基于涨停数据）
            rush_count = limit_up_count + sum(s.open_times for s in self._limit_up_cache)
            bomb_count = sum(s.open_times for s in self._limit_up_cache)
            bomb_rate = (bomb_count / rush_count * 100) if rush_count > 0 else 0
            
            # 最高连板
            max_streak = max([s.streak_days for s in self._limit_up_cache], default=0)
            
            # 总成交额（涨跌停股）
            total_amount = sum(s.amount for s in self._limit_up_cache + self._limit_down_cache)
            
            # 情绪判断
            sentiment = self._calculate_sentiment(
                limit_up_count, limit_down_count, 0, 0, bomb_rate
            )
            
            self._sentiment_cache = MarketSentiment(
                limit_up_count=limit_up_count,
                limit_down_count=limit_down_count,
                up_count=0,  # 暂不获取全市场数据
                down_count=0,
                flat_count=0,
                rush_count=rush_count,
                bomb_count=bomb_count,
                bomb_rate=round(bomb_rate, 2),
                max_streak=max_streak,
                sentiment=sentiment,
                total_amount=total_amount,
                update_time=datetime.now().strftime("%H:%M:%S"),
            )
        except Exception as e:
            print(f"刷新情绪数据失败: {e}")
    
    async def get_sentiment(self) -> MarketSentiment:
        """获取市场情绪"""
        if not self._is_cache_valid():
            await self.refresh_limit_data()
        
        if self._sentiment_cache:
            return self._sentiment_cache
        return self._empty_sentiment()
    
    async def get_sentiment_by_market(self, market: str = None) -> MarketSentiment:
        """获取指定市场情绪"""
        if not self._is_cache_valid():
            await self.refresh_limit_data()
        
        if not market:
            return await self.get_sentiment()
        
        # 筛选市场
        limit_up = self._filter_by_market(self._limit_up_cache, market)
        limit_down = self._filter_by_market(self._limit_down_cache, market)
        
        limit_up_count = len(limit_up)
        limit_down_count = len(limit_down)
        rush_count = limit_up_count + sum(s.open_times for s in limit_up)
        bomb_count = sum(s.open_times for s in limit_up)
        bomb_rate = (bomb_count / rush_count * 100) if rush_count > 0 else 0
        max_streak = max([s.streak_days for s in limit_up], default=0)
        
        sentiment = self._calculate_sentiment(limit_up_count, limit_down_count, 0, 0, bomb_rate)
        
        return MarketSentiment(
            limit_up_count=limit_up_count,
            limit_down_count=limit_down_count,
            up_count=0,
            down_count=0,
            flat_count=0,
            rush_count=rush_count,
            bomb_count=bomb_count,
            bomb_rate=round(bomb_rate, 2),
            max_streak=max_streak,
            sentiment=sentiment,
            total_amount=0,
            update_time=datetime.now().strftime("%H:%M:%S"),
        )
    
    async def get_limit_up_stocks(self, market: str = None) -> list[StockQuote]:
        """获取涨停股列表"""
        if not self._is_cache_valid():
            await self.refresh_limit_data()
        
        stocks = self._limit_up_cache
        if market:
            stocks = self._filter_by_market(stocks, market)
        return stocks
    
    async def get_limit_down_stocks(self, market: str = None) -> list[StockQuote]:
        """获取跌停股列表"""
        if not self._is_cache_valid():
            await self.refresh_limit_data()
        
        stocks = self._limit_down_cache
        if market:
            stocks = self._filter_by_market(stocks, market)
        return stocks
    
    def _filter_by_market(self, stocks: list[StockQuote], market: str) -> list[StockQuote]:
        """市场筛选"""
        result = []
        for s in stocks:
            code = s.symbol
            if market == "sh" and code.startswith("60"):
                result.append(s)
            elif market == "sz" and code.startswith("00"):
                result.append(s)
            elif market == "cyb" and code.startswith("30"):
                result.append(s)
            elif market == "kcb" and code.startswith("68"):
                result.append(s)
            elif market == "bj" and (code.startswith("8") or code.startswith("4")):
                result.append(s)
        return result
    
    async def get_stock_quote(self, symbol: str) -> Optional[StockQuote]:
        """获取单个股票行情"""
        # 先从缓存查找
        for s in self._limit_up_cache + self._limit_down_cache:
            if s.symbol == symbol:
                return s
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
        
        if up > 0 and down > 0:
            ratio = up / down
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
        
        if limit_down > 0:
            ld_ratio = limit_up / limit_down
            if ld_ratio < 2:
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
