"""
指数数据服务 - 获取A股主要指数行情
"""
import adata
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class IndexQuote(BaseModel):
    """指数行情"""
    code: str
    name: str
    price: float
    change: float
    change_pct: float
    update_time: str


class MarketSentiment(BaseModel):
    """市场情绪数据"""
    limit_up_count: int  # 涨停数
    limit_down_count: int  # 跌停数
    up_count: int  # 上涨数
    down_count: int  # 下跌数
    flat_count: int  # 平盘数
    rush_count: int  # 冲板数（曾触及涨停）
    bomb_count: int  # 炸板数（打开涨停）
    bomb_rate: float  # 炸板率
    max_streak: int  # 连板高度
    sentiment: str  # 情绪：偏强/中性/偏弱
    total_amount: float  # 总成交额
    update_time: str


# 主要指数代码映射
INDEX_CODES = {
    "sh000001": {"name": "上证", "market": "sh"},
    "sz399001": {"name": "深证", "market": "sz"},
    "sz399006": {"name": "创业板", "market": "sz"},
    "sh000688": {"name": "科创", "market": "sh"},
    "sh000300": {"name": "沪深300", "market": "sh"},
    "sh000016": {"name": "上证50", "market": "sh"},
}


class IndexService:
    """指数数据服务"""
    
    def __init__(self):
        self._cache: dict[str, tuple[IndexQuote, datetime]] = {}
        self._sentiment_cache: tuple[MarketSentiment, datetime] | None = None
    
    async def get_index_quote(self, code: str) -> Optional[IndexQuote]:
        """获取单个指数行情"""
        try:
            # 解析代码
            if code.startswith("sh"):
                stock_code = code[2:]
            elif code.startswith("sz"):
                stock_code = code[2:]
            else:
                stock_code = code
            
            df = adata.stock.market.get_market(stock_code=stock_code)
            if df is None or df.empty:
                return None
            
            row = df.iloc[0]
            index_info = INDEX_CODES.get(code, {"name": code})
            
            return IndexQuote(
                code=code,
                name=index_info.get("name", code),
                price=float(row.get("trade_price", 0)),
                change=float(row.get("change", 0)),
                change_pct=float(row.get("change_pct", 0)),
                update_time=datetime.now().strftime("%H:%M:%S"),
            )
        except Exception as e:
            print(f"获取指数行情失败 {code}: {e}")
            return None
    
    async def get_all_indices(self) -> list[IndexQuote]:
        """获取所有主要指数"""
        indices = []
        for code in INDEX_CODES.keys():
            quote = await self.get_index_quote(code)
            if quote:
                indices.append(quote)
        return indices
    
    async def get_market_sentiment(self) -> MarketSentiment:
        """获取市场情绪数据"""
        try:
            df = adata.stock.market.get_market_real_time()
            if df is None or df.empty:
                return self._empty_sentiment()
            
            limit_up_count = 0
            limit_down_count = 0
            up_count = 0
            down_count = 0
            flat_count = 0
            rush_count = 0  # 冲板：最高价触及涨停价
            bomb_count = 0  # 炸板：曾涨停但现在未涨停
            total_amount = 0.0
            
            for _, row in df.iterrows():
                change_pct = float(row.get("change_pct", 0))
                high_price = float(row.get("high_price", 0))
                pre_close = float(row.get("pre_close_price", 0))
                trade_price = float(row.get("trade_price", 0))
                amount = float(row.get("trade_amount", 0))
                
                total_amount += amount
                
                # 计算涨停价（简化：10%）
                limit_up_price = pre_close * 1.1 if pre_close > 0 else 0
                
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
                
                # 冲板：最高价接近涨停价
                if pre_close > 0 and high_price >= limit_up_price * 0.998:
                    rush_count += 1
                    # 炸板：曾冲板但现价低于涨停价
                    if trade_price < limit_up_price * 0.998:
                        bomb_count += 1
            
            # 计算炸板率
            bomb_rate = (bomb_count / rush_count * 100) if rush_count > 0 else 0
            
            # 计算情绪
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
                max_streak=0,  # 需要额外数据源
                sentiment=sentiment,
                total_amount=total_amount,
                update_time=datetime.now().strftime("%H:%M:%S"),
            )
        except Exception as e:
            print(f"获取市场情绪失败: {e}")
            return self._empty_sentiment()
    
    def _calculate_sentiment(
        self, 
        limit_up: int, 
        limit_down: int,
        up: int,
        down: int,
        bomb_rate: float
    ) -> str:
        """计算市场情绪"""
        # 涨跌比
        ratio = up / down if down > 0 else 10
        
        # 涨停跌停比
        ld_ratio = limit_up / limit_down if limit_down > 0 else 10
        
        # 综合评分
        score = 0
        
        # 涨跌比评分
        if ratio > 2:
            score += 2
        elif ratio > 1:
            score += 1
        elif ratio < 0.5:
            score -= 2
        elif ratio < 1:
            score -= 1
        
        # 涨停数评分
        if limit_up >= 50:
            score += 2
        elif limit_up >= 30:
            score += 1
        elif limit_up < 10:
            score -= 1
        
        # 炸板率评分
        if bomb_rate < 10:
            score += 1
        elif bomb_rate > 30:
            score -= 1
        
        # 涨停跌停比评分
        if ld_ratio > 5:
            score += 1
        elif ld_ratio < 1:
            score -= 2
        
        if score >= 3:
            return "偏强"
        elif score <= -2:
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
_index_service: Optional[IndexService] = None


def get_index_service() -> IndexService:
    global _index_service
    if _index_service is None:
        _index_service = IndexService()
    return _index_service
