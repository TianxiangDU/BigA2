# MCP 开发与接入指南

## 概述

MCP (Model Context Protocol) 是本项目的插件化策略系统，允许开发者以标准化方式接入自定义的交易策略和智能分析工具。

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    前端 (Next.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Dashboard  │  │  Stock Pool │  │   Paper     │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         └────────────────┼────────────────┘             │
│                          ▼                              │
│                   ┌─────────────┐                       │
│                   │  API Client │                       │
│                   └──────┬──────┘                       │
└──────────────────────────┼──────────────────────────────┘
                           │ HTTP/WebSocket
┌──────────────────────────┼──────────────────────────────┐
│                    后端 (FastAPI)                        │
│                          ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │                MCP 协调器 (Orchestrator)          │   │
│  │  ┌─────────────────────────────────────────────┐│   │
│  │  │              策略注册表 (Registry)           ││   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       ││   │
│  │  │  │Strategy1│ │Strategy2│ │Strategy3│       ││   │
│  │  │  └─────────┘ └─────────┘ └─────────┘       ││   │
│  │  └─────────────────────────────────────────────┘│   │
│  │                      ▼                          │   │
│  │  ┌─────────────────────────────────────────────┐│   │
│  │  │           Policy Gate (风控门禁)            ││   │
│  │  └─────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## MCP 类型

### 1. 策略 MCP (Strategy MCP)

用于实现交易策略逻辑，判断是否应该买入某只股票。

#### 接口定义

```python
from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime

class StrategyInput(BaseModel):
    """策略输入"""
    symbol: str           # 股票代码
    name: str             # 股票名称
    price: float          # 当前价格
    change_pct: float     # 涨跌幅
    volume: int           # 成交量
    amount: float         # 成交额
    bomb_rate: float      # 炸板率
    limit_up_count: int   # 涨停数
    streak_days: int      # 连板天数
    first_limit_time: str # 首次封板时间
    market_sentiment: str # 市场情绪

class StrategyOutput(BaseModel):
    """策略输出"""
    action: Literal["ALLOW", "WATCH", "BLOCK"]  # 操作建议
    score: float                                 # 综合评分 (0-100)
    confidence: float                            # 置信度 (0-1)
    one_liner: str                               # 一句话理由
    details: Optional[dict] = None               # 详细分析

class BaseStrategy(ABC):
    """策略基类"""
    
    @property
    @abstractmethod
    def id(self) -> str:
        """策略唯一标识"""
        pass
    
    @property
    @abstractmethod
    def name(self) -> str:
        """策略名称"""
        pass
    
    @property
    @abstractmethod
    def version(self) -> str:
        """策略版本"""
        pass
    
    @abstractmethod
    async def evaluate(self, input: StrategyInput) -> StrategyOutput:
        """
        执行策略评估
        
        Args:
            input: 策略输入数据
            
        Returns:
            StrategyOutput: 策略评估结果
        """
        pass
```

#### 示例：回封策略

```python
class ResealStrategy(BaseStrategy):
    """回封策略 - 分析炸板后回封的股票"""
    
    @property
    def id(self) -> str:
        return "reseal_v1"
    
    @property
    def name(self) -> str:
        return "回封策略"
    
    @property
    def version(self) -> str:
        return "1.0.0"
    
    def __init__(self, params: dict = None):
        self.params = params or {
            "max_bomb_rate": 0.30,      # 最大炸板率
            "reseal_speed_sec": 60,     # 回封速度阈值(秒)
            "min_volume": 300000000,    # 最小成交额
            "min_score": 60,            # 最小评分
        }
    
    async def evaluate(self, input: StrategyInput) -> StrategyOutput:
        score = 0
        reasons = []
        
        # 炸板率检查
        if input.bomb_rate <= self.params["max_bomb_rate"]:
            score += 30
            reasons.append(f"炸板率{input.bomb_rate:.1%}在阈值内")
        else:
            return StrategyOutput(
                action="BLOCK",
                score=0,
                confidence=0.9,
                one_liner=f"炸板率{input.bomb_rate:.1%}过高",
            )
        
        # 成交额检查
        if input.amount >= self.params["min_volume"]:
            score += 25
            reasons.append(f"成交额{input.amount/1e8:.1f}亿达标")
        else:
            score += 10
        
        # 连板检查
        if input.streak_days >= 2:
            score += 20
            reasons.append(f"连板{input.streak_days}天，有市场认可度")
        
        # 市场情绪
        if input.market_sentiment == "偏强":
            score += 15
        elif input.market_sentiment == "偏弱":
            score -= 10
        
        # 综合判断
        action = "ALLOW" if score >= self.params["min_score"] else "WATCH"
        
        return StrategyOutput(
            action=action,
            score=score,
            confidence=0.75,
            one_liner="; ".join(reasons[:2]),
            details={"reasons": reasons, "params_used": self.params},
        )
```

### 2. 智能体 MCP (Agent MCP)

用于提供智能分析能力，如市场解读、信号解释、风险提示等。

#### 接口定义

```python
from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Any

class AgentInput(BaseModel):
    """智能体输入"""
    context: dict      # 上下文数据
    query: str = ""    # 可选的查询

class AgentOutput(BaseModel):
    """智能体输出"""
    content: str       # 输出内容
    data: dict = {}    # 结构化数据
    confidence: float  # 置信度

class BaseAgent(ABC):
    """智能体基类"""
    
    @property
    @abstractmethod
    def id(self) -> str:
        pass
    
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @abstractmethod
    async def invoke(self, input: AgentInput) -> AgentOutput:
        pass
```

#### 智能体类型

| 类型 | 用途 | 输入 | 输出 |
|------|------|------|------|
| `market_state` | 市场状态解读 | 指数、涨跌停数据 | 市场概况文字 |
| `theme_heat` | 题材热度分析 | 涨停股列表 | 主线/分支题材 |
| `signal_explain` | 信号解释 | 单只股票数据 | 买入理由分析 |
| `risk_coach` | 风险教练 | 持仓、市场数据 | 风控建议 |
| `review_analyze` | 复盘分析 | 交易记录 | 归因和建议 |
| `strategy_critic` | 策略评估 | 策略运行结果 | 改进建议 |
| `ensemble_judge` | 策略仲裁 | 多策略结果 | 最终决策 |

## 注册与接入

### 1. 创建策略文件

```python
# server/strategies/my_strategy.py

from .base import BaseStrategy, StrategyInput, StrategyOutput

class MyStrategy(BaseStrategy):
    @property
    def id(self) -> str:
        return "my_strategy_v1"
    
    @property
    def name(self) -> str:
        return "我的策略"
    
    @property
    def version(self) -> str:
        return "1.0.0"
    
    async def evaluate(self, input: StrategyInput) -> StrategyOutput:
        # 实现你的策略逻辑
        pass
```

### 2. 注册到系统

```python
# server/strategies/__init__.py

from .registry import StrategyRegistry
from .my_strategy import MyStrategy

# 注册策略
registry = StrategyRegistry()
registry.register(MyStrategy())
```

### 3. 配置策略组

```python
# server/config/strategy_groups.py

STRATEGY_GROUPS = {
    "default": {
        "name": "默认策略组",
        "strategies": [
            {"id": "reseal_v1", "weight": 0.6, "enabled": True},
            {"id": "my_strategy_v1", "weight": 0.4, "enabled": True},
        ],
        "aggregation": "weighted",  # weighted | voting | first_match
        "conflict_rule": "any_block",  # any_block | majority_block
    }
}
```

## Policy Gate (风控门禁)

所有策略输出都会经过 Policy Gate 进行最终风控检查：

```python
class PolicyGate:
    """风控门禁"""
    
    RULES = [
        # (条件, 动作)
        ("risk_light == 'RED'", "BLOCK"),
        ("bomb_rate > 0.5", "BLOCK"),
        ("limit_down_count > limit_up_count", "BLOCK"),
        ("is_degraded", "WATCH"),
        ("confidence < 0.5", "WATCH"),
    ]
    
    async def check(self, result: StrategyOutput, context: dict) -> StrategyOutput:
        for condition, action in self.RULES:
            if self._evaluate_condition(condition, result, context):
                return StrategyOutput(
                    action=action,
                    score=result.score,
                    confidence=result.confidence,
                    one_liner=f"风控规则触发: {condition}",
                )
        return result
```

## API 端点

### 策略评估

```
POST /api/strategy/evaluate
Content-Type: application/json

{
  "symbol": "300xxx",
  "name": "示例股",
  "price": 15.80,
  "change_pct": 10.0,
  ...
}

Response:
{
  "action": "ALLOW",
  "score": 78.5,
  "confidence": 0.82,
  "one_liner": "炸板率18%在阈值内; 成交额5.2亿达标",
  "strategies_used": ["reseal_v1", "my_strategy_v1"],
  "risk_gate_passed": true
}
```

### 获取策略列表

```
GET /api/strategy/list

Response:
[
  {
    "id": "reseal_v1",
    "name": "回封策略",
    "version": "1.0.0",
    "enabled": true,
    "weight": 0.6,
    "params": {...}
  }
]
```

### 更新策略参数

```
PUT /api/strategy/{strategy_id}/params
Content-Type: application/json

{
  "max_bomb_rate": 0.25,
  "min_score": 65
}
```

## 开发指南

### 本地开发

```bash
# 1. 创建策略文件
touch server/strategies/my_strategy.py

# 2. 实现策略逻辑
# 参考上文示例

# 3. 注册策略
# 在 server/strategies/__init__.py 中添加

# 4. 重启服务
cd server && uvicorn main:app --reload

# 5. 测试
curl -X POST http://localhost:8000/api/strategy/evaluate \
  -H "Content-Type: application/json" \
  -d '{"symbol": "300xxx", "name": "测试", "price": 10.0, ...}'
```

### 测试

```python
# tests/test_my_strategy.py

import pytest
from strategies.my_strategy import MyStrategy
from strategies.base import StrategyInput

@pytest.mark.asyncio
async def test_my_strategy():
    strategy = MyStrategy()
    
    input = StrategyInput(
        symbol="300xxx",
        name="测试股",
        price=15.80,
        change_pct=10.0,
        volume=1000000,
        amount=500000000,
        bomb_rate=0.18,
        limit_up_count=50,
        streak_days=2,
        first_limit_time="09:35:00",
        market_sentiment="偏强",
    )
    
    output = await strategy.evaluate(input)
    
    assert output.action in ["ALLOW", "WATCH", "BLOCK"]
    assert 0 <= output.score <= 100
    assert 0 <= output.confidence <= 1
```

## 最佳实践

### 1. 策略设计原则

- **单一职责**: 每个策略只关注一个特定模式
- **参数化**: 关键阈值应可配置
- **可解释**: 提供清晰的决策理由
- **回测验证**: 新策略上线前进行历史回测

### 2. 性能优化

- 使用异步 I/O
- 缓存频繁查询的数据
- 批量处理多只股票

### 3. 错误处理

```python
async def evaluate(self, input: StrategyInput) -> StrategyOutput:
    try:
        # 策略逻辑
        pass
    except Exception as e:
        logger.error(f"Strategy {self.id} error: {e}")
        return StrategyOutput(
            action="WATCH",
            score=0,
            confidence=0,
            one_liner=f"策略异常: {str(e)}",
        )
```

## 版本管理

策略版本使用语义化版本号:

- `MAJOR.MINOR.PATCH`
- `MAJOR`: 不兼容的 API 变更
- `MINOR`: 向下兼容的功能新增
- `PATCH`: 向下兼容的问题修复

```python
@property
def version(self) -> str:
    return "1.2.3"
```

## 常见问题

### Q: 如何调试策略?

使用日志和详细输出:

```python
import logging
logger = logging.getLogger(__name__)

async def evaluate(self, input: StrategyInput) -> StrategyOutput:
    logger.debug(f"Evaluating {input.symbol} with params {self.params}")
    # ...
```

### Q: 如何处理多策略冲突?

使用 Orchestrator 的聚合规则:

- `weighted`: 加权平均分数
- `voting`: 多数投票决定 action
- `first_match`: 第一个非 WATCH 的结果

### Q: 如何接入外部 LLM?

```python
class LLMAgent(BaseAgent):
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
    
    async def invoke(self, input: AgentInput) -> AgentOutput:
        response = await self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": input.query}],
        )
        return AgentOutput(
            content=response.choices[0].message.content,
            confidence=0.8,
        )
```
