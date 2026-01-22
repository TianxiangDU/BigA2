# BigA2 - A股打板提示工具

智能打板策略提示与复盘系统，基于 shadcn/ui + Tailwind CSS + FastAPI + MCP 策略插件架构。

**🔴 主题色**: 喜庆红色系，涨红跌绿，A股风格

## 功能特性

### 核心功能
- 📊 **Dashboard**: 风险灯、市场状态、涨跌停统计、成交额实时监控
- 📋 **股池**: 涨停股实时列表，策略推荐候选股票，支持筛选和排序
- 📈 **个股详情**: 触发条件、执行计划、题材梯队、历史回放
- 💼 **模拟盘**: 模拟买卖，关联提示卡，盈亏归因统计
- 💰 **仓位管理**: 持仓列表、实时盈亏、风控状态
- 🔄 **复盘**: 结果标注、归因分析、参数调整建议
- 🏭 **策略工厂**: 策略卡 DSL 编辑、校验、发布
- 📊 **统计分析**: 策略表现、策略组表现、盈亏曲线
- ⚙️ **设置**: 策略组配置、数据源管理

### v0.2 新增功能
- ✅ **FastAPI 后端服务** - 完整的 REST API
- ✅ **SQLite 数据持久化** - 策略卡、订单、持仓、复盘数据
- ✅ **adata 真实行情接入** - A股实时行情数据
- ✅ **策略 DSL 校验器** - 字段/阈值/依赖校验
- ✅ **策略草案生成** - 从内容资产生成策略草案
- ✅ **前端 API 对接** - React Query hooks + API 客户端

## 技术栈

### 前端
- **框架**: Next.js 16 (App Router) + TypeScript
- **UI**: shadcn/ui + Tailwind CSS (喜庆红主题)
- **状态管理**: Zustand
- **数据请求**: TanStack Query
- **图标**: lucide-react
- **主题**: next-themes (亮/暗模式)

### 后端
- **框架**: FastAPI + Python 3.10+
- **数据库**: SQLite + SQLAlchemy (async)
- **数据源**: adata (A股实时行情)
- **验证**: Pydantic v2

### MCP 插件层
- **策略 MCP**: 荐股策略（reseal_v1、firstseal_guard_v1）
- **智能体 MCP**: 市场状态、题材分析、信号解释、风控建议、复盘归因、策略评估
- **Figma MCP**: 设计稿到代码转换

## 快速开始

### 方式一：一键启动

```bash
./scripts/start-all.sh
```

### 方式二：分别启动

#### 1. 启动后端服务

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

后端服务：
- API: http://localhost:8000
- API 文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health

#### 2. 启动前端应用

```bash
cd app
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
npm run dev
```

前端应用：http://localhost:3000

## API 接口

### 市场数据
- `GET /api/market/overview` - 市场概览（涨跌停、成交额）
- `GET /api/market/quote/{symbol}` - 单股行情
- `POST /api/market/quotes` - 批量行情
- `GET /api/market/limit-up` - 涨停股列表
- `GET /api/market/kline/{symbol}` - K线数据

### 策略管理
- `GET /api/strategy/assets` - 内容资产列表
- `POST /api/strategy/assets` - 创建内容资产
- `GET /api/strategy/cards` - 策略卡列表
- `POST /api/strategy/cards` - 创建策略卡
- `POST /api/strategy/validate-dsl` - DSL 校验
- `POST /api/strategy/generate-draft` - 生成策略草案

### 模拟盘
- `GET /api/paper/orders` - 订单列表
- `POST /api/paper/orders` - 创建订单
- `POST /api/paper/orders/{id}/fill` - 成交订单
- `GET /api/paper/positions` - 持仓列表
- `GET /api/paper/trades` - 成交记录
- `GET /api/paper/stats` - 统计数据

### 统计分析
- `GET /api/analytics/strategy-performance` - 策略表现
- `GET /api/analytics/group-performance` - 策略组表现
- `GET /api/analytics/daily-pnl` - 每日盈亏曲线
- `GET /api/analytics/attribution` - 归因分析

## 项目结构

```
BigA2/
├── app/                        # Next.js 前端
│   ├── src/
│   │   ├── app/                # App Router 页面
│   │   ├── components/         # React 组件
│   │   │   ├── ui/             # shadcn/ui 组件
│   │   │   ├── layout/         # 布局组件
│   │   │   ├── dashboard/      # Dashboard 组件
│   │   │   ├── pool/           # 股池组件
│   │   │   ├── paper/          # 模拟盘组件
│   │   │   ├── factory/        # 策略工厂组件
│   │   │   └── analytics/      # 统计分析组件
│   │   └── lib/
│   │       ├── api/            # API 客户端
│   │       ├── hooks/          # React Query Hooks
│   │       ├── schemas/        # Zod Schema
│   │       └── mcp/            # MCP 客户端
├── server/                     # FastAPI 后端
│   ├── main.py                 # 入口
│   ├── config.py               # 配置
│   ├── database.py             # 数据模型
│   ├── routers/                # API 路由
│   │   ├── market.py           # 市场数据
│   │   ├── strategy.py         # 策略管理
│   │   ├── paper.py            # 模拟盘
│   │   ├── review.py           # 复盘
│   │   └── analytics.py        # 统计
│   └── services/
│       └── adata_service.py    # adata 数据服务
├── mcp/
│   ├── figma/                  # Figma MCP Server
│   └── agents/                 # 智能体 MCP Server
└── scripts/                    # 启动脚本
```

## 设计系统

### 主题色 (喜庆红)
- **Primary**: `oklch(0.55 0.22 25)` - 主色调红
- **Accent**: `oklch(0.85 0.12 85)` - 点缀金色

### 股票颜色 (A股风格)
- **涨**: `--stock-up` 红色
- **跌**: `--stock-down` 绿色
- **风控灯**: `--risk-green/yellow/red`

### Token 使用优先级
1. shadcn 语义 token: `bg-background`, `text-foreground`
2. Tailwind 原子: 布局/间距/尺寸
3. 禁止: 新增自定义 CSS

## 风控规则

| 条件 | 行为 |
|------|------|
| risk_light = RED | 禁止新增（全部 BLOCK） |
| is_degraded = true | 禁止 ALLOW（降级为 WATCH） |
| confidence < 0.6 | 禁止 ALLOW |
| risk_light = YELLOW | 总仓位 ≤ 60%，单票 ≤ 10% |
| bomb_rate > 0.3 | 总仓位 ≤ 50%，单票 ≤ 8% |
| 连亏 ≥ 2 | 单票 ≤ 6% |

## 未完成功能

### 🔴 高优先级
- [ ] 策略卡可视化编辑器（表单 + dry-run 预览）
- [ ] WebSocket 实时推送
- [ ] 北向资金数据接入

### 🟡 中优先级
- [ ] 历史复盘回放
- [ ] 策略批量回测
- [ ] 多策略组合执行
- [ ] 通知系统（微信/钉钉）

### ⚪ 低优先级
- [ ] 用户认证系统
- [ ] 策略市场
- [ ] 移动端适配

## 版本历史

### v0.2.0 (2026-01-22)
- ✅ 新增 FastAPI 后端服务
- ✅ 新增 SQLite 数据库持久化
- ✅ 接入 adata 真实行情数据
- ✅ 实现策略 DSL 校验器
- ✅ 实现策略草案生成
- ✅ 前端 API 对接（React Query）

### v0.1.0 (2026-01-21)
- ✅ Next.js 16 + shadcn/ui 项目初始化
- ✅ 喜庆红主题配色
- ✅ 7 个页面骨架
- ✅ Zod Schema 定义
- ✅ MCP 策略层架构
- ✅ Figma MCP 设计转代码
- ✅ 智能体 MCP（7个工具）

## License

MIT
