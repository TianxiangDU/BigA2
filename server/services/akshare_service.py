"""
akshare 数据服务 - A股真实行情数据接入（东方财富数据源）
收盘后也能获取当日数据
"""
import os
# 禁用代理
os.environ['NO_PROXY'] = '*'
os.environ['no_proxy'] = '*'

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
    update_time: str


class MarketSentiment(BaseModel):
    """市场情绪数据"""
    limit_up_count: int
    limit_down_count: int
    up_count: int
    down_count: int
    flat_count: int
    rush_count: int  # 冲板数
    bomb_count: int  # 炸板数
    bomb_rate: float
    max_streak: int
    sentiment: str
    total_amount: float
    update_time: str


# 主要指数名称映射
INDEX_NAME_MAP = {
    "上证指数": "上证",
    "深证成指": "深证",
    "创业板指": "创业板",
    "科创50": "科创",
    "沪深300": "沪深300",
    "上证50": "上证50",
}


class AkshareService:
    """akshare 数据服务"""
    
    def __init__(self):
        self._stock_df: Optional[pd.DataFrame] = None
        self._index_df: Optional[pd.DataFrame] = None
        self._last_update: Optional[datetime] = None
        self._cache_seconds = 5  # 缓存5秒
    
    def _is_cache_valid(self) -> bool:
        """检查缓存是否有效"""
        if self._last_update is None:
            return False
        return (datetime.now() - self._last_update).total_seconds() < self._cache_seconds
    
    async def refresh_data(self):
        """刷新数据"""
        try:
            # 获取A股实时行情
            self._stock_df = ak.stock_zh_a_spot_em()
            # 获取指数行情
            self._index_df = ak.stock_zh_index_spot_em()
            self._last_update = datetime.now()
        except Exception as e:
            print(f"刷新数据失败: {e}")
    
    async def get_indices(self) -> list[IndexQuote]:
        """获取主要指数行情"""
        if not self._is_cache_valid():
            await self.refresh_data()
        
        if self._index_df is None or self._index_df.empty:
            return []
        
        indices = []
        target_names = list(INDEX_NAME_MAP.keys())
        
        for _, row in self._index_df.iterrows():
            name = str(row.get("名称", ""))
            if name not in target_names:
                continue
            
            indices.append(IndexQuote(
                code=str(row.get("代码", "")),
                name=INDEX_NAME_MAP.get(name, name),
                price=float(row.get("最新价", 0) or 0),
                change=float(row.get("涨跌额", 0) or 0),
                change_pct=float(row.get("涨跌幅", 0) or 0),
                open=float(row.get("今开", 0) or 0),
                high=float(row.get("最高", 0) or 0),
                low=float(row.get("最低", 0) or 0),
                pre_close=float(row.get("昨收", 0) or 0),
                volume=int(row.get("成交量", 0) or 0),
                amount=float(row.get("成交额", 0) or 0),
                update_time=datetime.now().strftime("%H:%M:%S"),
            ))
        
        # 按固定顺序排序
        order = ["上证", "深证", "创业板", "科创", "沪深300", "上证50"]
        indices.sort(key=lambda x: order.index(x.name) if x.name in order else 99)
        
        return indices
    
    async def get_sentiment(self) -> MarketSentiment:
        """获取市场情绪数据"""
        if not self._is_cache_valid():
            await self.refresh_data()
        
        if self._stock_df is None or self._stock_df.empty:
            return self._empty_sentiment()
        
        df = self._stock_df
        
        # 基础统计
        up_count = len(df[df["涨跌幅"] > 0])
        down_count = len(df[df["涨跌幅"] < 0])
        flat_count = len(df[df["涨跌幅"] == 0])
        
        # 涨停/跌停（考虑ST股5%，普通股10%/20%）
        limit_up = df[df["涨跌幅"] >= 9.9]
        limit_down = df[df["涨跌幅"] <= -9.9]
        limit_up_count = len(limit_up)
        limit_down_count = len(limit_down)
        
        # 冲板数：最高价触及涨停价（简化：涨幅>=9.9% 或 最高价/昨收 >= 1.099）
        rush_count = 0
        bomb_count = 0
        for _, row in df.iterrows():
            high = float(row.get("最高", 0) or 0)
            pre_close = float(row.get("昨收", 0) or 0)
            price = float(row.get("最新价", 0) or 0)
            change_pct = float(row.get("涨跌幅", 0) or 0)
            
            if pre_close > 0:
                high_pct = (high - pre_close) / pre_close * 100
                if high_pct >= 9.9:
                    rush_count += 1
                    # 炸板：最高触及涨停但收盘未涨停
                    if change_pct < 9.9:
                        bomb_count += 1
        
        # 炸板率
        bomb_rate = (bomb_count / rush_count * 100) if rush_count > 0 else 0
        
        # 总成交额
        total_amount = float(df["成交额"].sum() or 0)
        
        # 情绪判断
        sentiment = self._calculate_sentiment(
            limit_up_count, limit_down_count,
            up_count, down_count, bomb_rate
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
            max_streak=0,  # 需要额外数据源计算连板
            sentiment=sentiment,
            total_amount=total_amount,
            update_time=datetime.now().strftime("%H:%M:%S"),
        )
    
    async def get_limit_up_stocks(self) -> list[StockQuote]:
        """获取涨停股列表"""
        if not self._is_cache_valid():
            await self.refresh_data()
        
        if self._stock_df is None or self._stock_df.empty:
            return []
        
        # 筛选涨停股
        df = self._stock_df[self._stock_df["涨跌幅"] >= 9.9].copy()
        # 按成交额排序
        df = df.sort_values("成交额", ascending=False)
        
        stocks = []
        for _, row in df.head(50).iterrows():
            stocks.append(StockQuote(
                symbol=str(row.get("代码", "")),
                name=str(row.get("名称", "")),
                price=float(row.get("最新价", 0) or 0),
                change=float(row.get("涨跌额", 0) or 0),
                change_pct=float(row.get("涨跌幅", 0) or 0),
                volume=int(row.get("成交量", 0) or 0),
                amount=float(row.get("成交额", 0) or 0),
                open=float(row.get("今开", 0) or 0),
                high=float(row.get("最高", 0) or 0),
                low=float(row.get("最低", 0) or 0),
                pre_close=float(row.get("昨收", 0) or 0),
                turnover_rate=float(row.get("换手率", 0) or 0),
                update_time=datetime.now().strftime("%H:%M:%S"),
            ))
        
        return stocks
    
    async def get_stock_quote(self, symbol: str) -> Optional[StockQuote]:
        """获取单个股票行情"""
        if not self._is_cache_valid():
            await self.refresh_data()
        
        if self._stock_df is None or self._stock_df.empty:
            return None
        
        df = self._stock_df[self._stock_df["代码"] == symbol]
        if df.empty:
            return None
        
        row = df.iloc[0]
        return StockQuote(
            symbol=str(row.get("代码", "")),
            name=str(row.get("名称", "")),
            price=float(row.get("最新价", 0) or 0),
            change=float(row.get("涨跌额", 0) or 0),
            change_pct=float(row.get("涨跌幅", 0) or 0),
            volume=int(row.get("成交量", 0) or 0),
            amount=float(row.get("成交额", 0) or 0),
            open=float(row.get("今开", 0) or 0),
            high=float(row.get("最高", 0) or 0),
            low=float(row.get("最低", 0) or 0),
            pre_close=float(row.get("昨收", 0) or 0),
            turnover_rate=float(row.get("换手率", 0) or 0),
            update_time=datetime.now().strftime("%H:%M:%S"),
        )
    
    async def get_market_overview(self):
        """获取市场概览（兼容旧 API）"""
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
    
    def _calculate_sentiment(
        self,
        limit_up: int,
        limit_down: int,
        up: int,
        down: int,
        bomb_rate: float
    ) -> str:
        """计算市场情绪"""
        score = 0
        
        # 涨跌比
        ratio = up / down if down > 0 else 10
        if ratio > 2:
            score += 2
        elif ratio > 1.2:
            score += 1
        elif ratio < 0.5:
            score -= 2
        elif ratio < 0.8:
            score -= 1
        
        # 涨停数
        if limit_up >= 80:
            score += 2
        elif limit_up >= 50:
            score += 1
        elif limit_up < 20:
            score -= 1
        
        # 炸板率
        if bomb_rate < 10:
            score += 1
        elif bomb_rate > 25:
            score -= 1
        
        # 涨停跌停比
        ld_ratio = limit_up / limit_down if limit_down > 0 else 10
        if ld_ratio > 10:
            score += 1
        elif ld_ratio < 2:
            score -= 1
        
        if score >= 3:
            return "偏强"
        elif score <= -1:
            return "偏弱"
        else:
            return "中性"
    
    def _empty_sentiment(self) -> MarketSentiment:
        return MarketSentiment(
            limit_up_count=0,
            limit_down_count=0,
            up_count=0,
            down_count=0,
            flat_count=0,
            rush_count=0,
            bomb_count=0,
            bomb_rate=0,
            max_streak=0,
            sentiment="--",
            total_amount=0,
            update_time=datetime.now().strftime("%H:%M:%S"),
        )


# 单例
_akshare_service: Optional[AkshareService] = None


def get_akshare_service() -> AkshareService:
    global _akshare_service
    if _akshare_service is None:
        _akshare_service = AkshareService()
    return _akshare_service
