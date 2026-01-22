# 打板提示 - A股涨停板交易辅助工具

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.4-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-green" alt="FastAPI" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Python-3.11+-yellow" alt="Python" />
</p>

一款面向 A 股涨停板交易的智能辅助工具，提供实时行情、策略提示、模拟盘交易和复盘分析功能。

## ✨ 功能特性

### 📊 实时行情看板

- **指数行情**: 上证、深证、创业板、科创板、沪深300、上证50
- **市场情绪**: 涨停数、跌停数、冲板数、炸板率、最高连板
- **涨跌停列表**: 实时涨停/跌停股票列表，支持市场筛选
- **智能刷新**: 交易时间自动刷新，休市自动暂停

### 🎯 策略系统 (MCP)

- **策略工厂**: 可视化策略卡片创建与管理
- **策略组**: 多策略组合与加权执行
- **风控门禁**: 自动风控规则检查
- **策略评估**: 历史回测与性能分析

### 📈 模拟盘交易

- **订单管理**: 买入/卖出/撤单
- **持仓跟踪**: 实时盈亏计算
- **归因分析**: 交易与策略关联

### 📝 复盘系统

- **结果标注**: 成功/失败/未执行
- **归因分析**: AI 辅助分析失败原因
- **参数建议**: 策略参数优化建议

### ⚠️ 风控系统

- **风险灯**: 绿/黄/红三级风控状态
- **实时监控**: 基于市场数据动态调整
- **仓位控制**: 自动计算最大仓位限制

## 🛠️ 技术架构

```
┌─────────────────────────────────────────────────────┐
│                    前端 (Next.js)                    │
│  ┌─────────────────────────────────────────────────┐│
│  │  shadcn/ui + Tailwind CSS + TanStack Query     ││
│  │  Zustand (状态管理) + Zod (数据校验)            ││
│  └─────────────────────────────────────────────────┘│
└───────────────────────┬─────────────────────────────┘
                        │ REST API
┌───────────────────────┼─────────────────────────────┐
│                    后端 (FastAPI)                    │
│  ┌─────────────────────────────────────────────────┐│
│  │  SQLite + SQLAlchemy ORM                        ││
│  │  akshare + 东方财富 API (行情数据)              ││
│  │  MCP 策略系统 (可扩展)                          ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- Python >= 3.11
- pnpm / npm / yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/TianxiangDU/BigA2.git
cd BigA2

# 安装前端依赖
cd app
npm install

# 安装后端依赖
cd ../server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 启动服务

**后端 (FastAPI)**

```bash
cd server
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# API 文档: http://localhost:8000/docs
```

**前端 (Next.js)**

```bash
cd app
npm run dev

# 访问: http://localhost:3000
```

## 📁 项目结构

```
BigA2/
├── app/                          # Next.js 前端
│   ├── src/
│   │   ├── app/                  # 页面路由
│   │   │   ├── dashboard/        # 概览页
│   │   │   ├── pool/             # 股池页
│   │   │   ├── factory/          # 策略工厂
│   │   │   ├── groups/           # 策略组
│   │   │   ├── paper/            # 模拟盘
│   │   │   ├── portfolio/        # 仓位
│   │   │   ├── analytics/        # 统计分析
│   │   │   ├── review/           # 复盘
│   │   │   └── settings/         # 设置
│   │   ├── components/           # UI 组件
│   │   │   ├── ui/               # shadcn/ui 基础组件
│   │   │   ├── layout/           # 布局组件
│   │   │   ├── dashboard/        # 概览组件
│   │   │   ├── pool/             # 股池组件
│   │   │   ├── paper/            # 模拟盘组件
│   │   │   ├── portfolio/        # 仓位组件
│   │   │   ├── review/           # 复盘组件
│   │   │   ├── analytics/        # 统计组件
│   │   │   └── settings/         # 设置组件
│   │   └── lib/
│   │       ├── api/              # API 客户端
│   │       ├── hooks/            # React Query Hooks
│   │       ├── schemas/          # Zod 数据校验
│   │       └── utils.ts          # 工具函数
│   └── package.json
│
├── server/                       # FastAPI 后端
│   ├── main.py                   # 服务入口
│   ├── config.py                 # 配置
│   ├── database.py               # 数据库模型
│   ├── routers/                  # API 路由
│   │   ├── market.py             # 行情 API
│   │   ├── strategy.py           # 策略 API
│   │   ├── paper.py              # 模拟盘 API
│   │   ├── review.py             # 复盘 API
│   │   └── analytics.py          # 统计 API
│   ├── services/                 # 业务服务
│   │   └── eastmoney_service.py  # 东方财富数据服务
│   └── requirements.txt
│
├── docs/                         # 文档
│   └── MCP_DEVELOPMENT.md        # MCP 开发指南
│
├── scripts/                      # 启动脚本
│   ├── start-server.sh
│   ├── start-app.sh
│   └── start-all.sh
│
└── README.md
```

## 📡 API 端点

### 行情 API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/market/indices` | GET | 主要指数行情 |
| `/api/market/sentiment` | GET | 市场情绪数据 |
| `/api/market/limit-up` | GET | 涨停股列表 |
| `/api/market/limit-down` | GET | 跌停股列表 |
| `/api/market/quote/{symbol}` | GET | 单股行情 |

### 策略 API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/strategy/list` | GET | 策略列表 |
| `/api/strategy/evaluate` | POST | 策略评估 |
| `/api/strategy/{id}/params` | PUT | 更新参数 |

### 模拟盘 API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/paper/orders` | GET/POST | 订单管理 |
| `/api/paper/positions` | GET | 持仓列表 |
| `/api/paper/stats` | GET | 交易统计 |

## ⚙️ 风控规则

| 条件 | 风险灯 | 操作限制 |
|------|--------|----------|
| 涨停数 < 20 | 🔴 红灯 | 禁止新增 |
| 跌停 > 涨停 | 🔴 红灯 | 禁止操作 |
| 炸板率 > 50% | 🔴 红灯 | 禁止追涨停 |
| 炸板率 > 30% | 🟡 黄灯 | 仓位 ≤ 50%，单票 ≤ 8% |
| 正常 | 🟢 绿灯 | 无限制 |

## 🔌 MCP 开发

详见 [MCP 开发与接入指南](docs/MCP_DEVELOPMENT.md)

### 快速示例

```python
from strategies.base import BaseStrategy, StrategyInput, StrategyOutput

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
        # 你的策略逻辑
        return StrategyOutput(
            action="ALLOW",
            score=80,
            confidence=0.85,
            one_liner="符合条件",
        )
```

## 📋 待开发功能

### 高优先级

- [ ] 策略卡可视化编辑器
- [ ] WebSocket 实时推送
- [ ] LLM 智能分析接入
- [ ] 历史数据回测

### 中优先级

- [ ] 多策略组管理
- [ ] 策略版本对比
- [ ] 导出/导入功能
- [ ] 消息通知 (微信/钉钉)

### 低优先级

- [ ] 移动端适配
- [ ] 多用户支持
- [ ] 自动交易接口

## 📜 版本历史

### v0.3.0 (2026-01-22)

**清理与文档**
- 移除所有 mock 数据，组件显示真实 API 数据或空状态
- 删除 mock MCP 代码
- 创建 MCP 开发与接入文档
- 修复多处 CSS 变量语法问题
- 修复 HTML 嵌套错误 (li/button)

### v0.2.0 (2026-01-22)

**市场看板增强**
- 新增市场看板（指数、情绪、涨跌停列表）
- 支持多市场筛选（沪、深、创业板、科创板、北交所）
- 红绿色标识涨跌
- 风险灯移至侧边栏
- 智能刷新逻辑

**后端数据接入**
- FastAPI 后端服务
- SQLite + SQLAlchemy ORM
- akshare + 东方财富 API 数据源
- 收盘后数据正常显示

### v0.1.0 (2026-01-21)

**初始版本**
- Next.js 16 + shadcn/ui 前端框架
- 7 个页面骨架
- Zod 数据校验
- 基础组件库

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

<p align="center">
  Made with ❤️ for A-share traders
</p>
