# 🎯 A股打板提示工具 (BigA2)

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-red" alt="Version" />
  <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4.0-cyan" alt="Tailwind" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-latest-orange" alt="shadcn/ui" />
</p>

智能打板策略提示与复盘系统，基于 **shadcn/ui + Tailwind CSS + MCP 策略插件架构**，采用喜庆红金主题，专为 A 股涨停板交易设计。

---

## 📖 目录

- [项目简介](#-项目简介)
- [功能特性](#-功能特性)
- [技术架构](#-技术架构)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [MCP 插件系统](#-mcp-插件系统)
- [设计系统](#-设计系统)
- [风控规则](#-风控规则)
- [未完成功能](#-未完成功能)
- [版本历史](#-版本历史)
- [License](#-license)

---

## 🎯 项目简介

BigA2 是一个面向个人投资者的 A 股打板（涨停板）交易辅助工具，核心功能包括：

- **多模态策略卡工厂**：从文本/图片/视频等内容生成可执行的策略卡
- **策略组合与编排**：多策略并行运行 + 智能聚合 + 冲突仲裁
- **风控闸门**：硬性风控规则，红灯禁止、数据降级禁止等
- **模拟盘交易**：模拟买卖并记录归因，统计策略表现
- **复盘归因**：回看提示卡结果，AI 辅助归因分析与参数调整建议

### 核心理念

1. **策略可插拔**：策略以 MCP 插件方式接入，支持热插拔与组合
2. **可解释性**：每个推荐都有触发条件、执行计划、风险提示
3. **可回放**：每次推荐绑定快照，支持复盘对比
4. **硬风控优先**：任何策略建议都不能绕过 Policy Gate

---

## ✨ 功能特性

### 已实现功能 (v0.1.0)

| 模块 | 功能 | 状态 |
|------|------|------|
| **Dashboard** | 风险灯、市场状态、题材热度、策略运行统计、最近提示 | ✅ 完成 |
| **股池** | 候选股票列表、筛选过滤、策略推荐展示 | ✅ 完成 |
| **个股详情** | 触发条件、执行计划、题材梯队、历史回放 | ✅ 完成 |
| **策略工厂** | 内容资产管理、策略卡列表、状态管理 | ✅ 完成 |
| **策略组** | 策略组合配置、权重设置、启用/禁用 | ✅ 完成 |
| **模拟盘** | 下单表单、订单历史、交易统计 | ✅ 完成 |
| **仓位管理** | 持仓列表、风控状态、仓位建议 | ✅ 完成 |
| **统计分析** | 策略/策略组表现、胜率/盈亏比/回撤 | ✅ 完成 |
| **复盘** | 结果标注、归因分析、参数建议 | ✅ 完成 |
| **设置** | 策略参数配置、数据源管理 | ✅ 完成 |
| **主题** | 喜庆红金主题、暗色/亮色切换 | ✅ 完成 |
| **MCP 策略层** | 注册表、客户端、编排器、Policy Gate | ✅ 完成 |
| **MCP 智能体** | 7 个核心工具（市场状态/题材/信号/风控/复盘/评估/仲裁） | ✅ 完成 |
| **Figma MCP** | 设计稿到代码转换工具封装 | ✅ 完成 |

---

## 🏗 技术架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Dashboard  │  │  Stock Pool │  │   Factory   │  ...         │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                           │                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              UI Components (shadcn/ui + Tailwind)          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                       MCP Client Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Strategy Client │  │  Agent Client   │  │  Figma Client   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Orchestrator Layer                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Aggregator    │  │   Policy Gate   │  │ Signal Generator│  │
│  │ (加权/投票/过滤) │  │ (硬风控裁决)    │  │  (提示卡生成)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                       MCP Servers                                │
│  ┌────────────────────────┐  ┌────────────────────────────────┐ │
│  │   Strategy MCP         │  │   Agent MCP (daban-agents)     │ │
│  │ • reseal_v1            │  │ • market_state                 │ │
│  │ • firstseal_guard_v1   │  │ • theme_heat                   │ │
│  │ • (可扩展...)          │  │ • signal_explain               │ │
│  └────────────────────────┘  │ • risk_coach                   │ │
│                              │ • review_analyze               │ │
│  ┌────────────────────────┐  │ • strategy_critic              │ │
│  │   Figma MCP            │  │ • ensemble_judge               │ │
│  │ • get_file             │  └────────────────────────────────┘ │
│  │ • get_node             │                                     │
│  │ • get_images           │                                     │
│  └────────────────────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术选型 |
|------|----------|
| **框架** | Next.js 15 (App Router) + TypeScript |
| **UI** | shadcn/ui + Tailwind CSS 4.0 |
| **状态管理** | Zustand |
| **数据请求** | TanStack Query |
| **表格** | TanStack Table |
| **图标** | lucide-react |
| **主题** | next-themes |
| **Schema** | Zod |
| **MCP** | 自定义 MCP Client + Mock Transport |

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/TianxiangDU/BigA2.git
cd BigA2

# 安装前端依赖
cd app
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 构建

```bash
cd app
npm run build
npm start
```

---

## 📁 项目结构

```
BigA2/
├── README.md                    # 项目说明文档
├── .gitignore                   # Git 忽略配置
├── PRD_*.md                     # 产品需求文档
├── 智能体开发文档_*.md           # 智能体开发文档
│
├── app/                         # Next.js 前端应用
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/                 # 页面路由
│   │   │   ├── dashboard/       # 概览页
│   │   │   ├── pool/            # 股池页
│   │   │   ├── stock/[symbol]/  # 个股详情页
│   │   │   ├── factory/         # 策略工厂页
│   │   │   ├── groups/          # 策略组页
│   │   │   ├── paper/           # 模拟盘页
│   │   │   ├── portfolio/       # 仓位页
│   │   │   ├── analytics/       # 统计分析页
│   │   │   ├── review/          # 复盘页
│   │   │   ├── settings/        # 设置页
│   │   │   ├── globals.css      # 全局样式 (CSS 变量)
│   │   │   └── layout.tsx       # 根布局
│   │   │
│   │   ├── components/          # React 组件
│   │   │   ├── ui/              # shadcn/ui 基础组件
│   │   │   ├── layout/          # 布局组件
│   │   │   ├── providers/       # Provider 组件
│   │   │   ├── dashboard/       # Dashboard 业务组件
│   │   │   ├── pool/            # 股池业务组件
│   │   │   ├── stock/           # 个股业务组件
│   │   │   ├── factory/         # 策略工厂组件
│   │   │   ├── groups/          # 策略组组件
│   │   │   ├── paper/           # 模拟盘组件
│   │   │   ├── portfolio/       # 仓位组件
│   │   │   ├── analytics/       # 统计分析组件
│   │   │   ├── review/          # 复盘组件
│   │   │   └── settings/        # 设置组件
│   │   │
│   │   └── lib/                 # 工具库
│   │       ├── utils.ts         # 通用工具函数
│   │       ├── schemas/         # Zod Schema 定义
│   │       │   ├── market.ts    # 市场相关
│   │       │   ├── strategy.ts  # 策略相关
│   │       │   ├── alert.ts     # 提示卡相关
│   │       │   ├── portfolio.ts # 仓位相关
│   │       │   └── review.ts    # 复盘相关
│   │       │
│   │       └── mcp/             # MCP 客户端
│   │           ├── types.ts     # 类型定义
│   │           ├── registry.ts  # 策略注册表
│   │           ├── client.ts    # MCP 客户端
│   │           ├── orchestrator.ts # 策略编排器
│   │           └── __tests__/   # 测试用例
│   │
│   └── public/                  # 静态资源
│
└── mcp/                         # MCP 服务器
    ├── agents/                  # 智能体 MCP 服务器
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── README.md
    │   └── src/
    │       ├── index.ts         # 入口
    │       ├── types.ts         # 类型定义
    │       └── tools/           # 工具实现
    │           ├── market-state.ts
    │           ├── theme-heat.ts
    │           ├── signal-explain.ts
    │           ├── risk-coach.ts
    │           ├── review-analyze.ts
    │           ├── strategy-critic.ts
    │           └── ensemble-judge.ts
    │
    └── figma/                   # Figma MCP 服务器
        ├── package.json
        ├── tsconfig.json
        ├── README.md
        └── src/
            ├── index.ts         # 入口
            ├── client.ts        # Figma API 客户端
            └── component-tree.ts # 组件树生成器
```

---

## 🔌 MCP 插件系统

### 策略 MCP

策略以 MCP 插件方式接入，统一输出 `StrategyResult`：

```typescript
interface StrategyResult {
  strategyId: string;
  version: string;
  ts: string;
  recommendations: Array<{
    symbol: string;
    name: string;
    action: "ALLOW" | "WATCH" | "BLOCK";
    score: number;
    confidence: number;
    tags: string[];
    positionHint: { maxSinglePosition: number };
    triggers: Array<{ name: string; status: string; detail: string }>;
    plan?: { entryNote: string; exitRules: string[] };
    risks: string[];
  }>;
  warnings: string[];
  meta: { paramsUsed: object; runtimeMs: number };
}
```

### 智能体 MCP

| 工具 | 功能 | 调用时机 |
|------|------|----------|
| `market_state` | 市场状态解释 | Dashboard 定时刷新 |
| `theme_heat` | 题材热度分析 | Dashboard 定时刷新 |
| `signal_explain` | 信号卡生成 | 个股详情页/用户点击 |
| `risk_coach` | 风控建议 | 模拟盘下单前 |
| `review_analyze` | 复盘归因 | 用户标注结果后 |
| `strategy_critic` | 策略评估 | 策略卡详情页 |
| `ensemble_judge` | 并行策略仲裁 | 策略组运行后 |

### Figma MCP

| 工具 | 功能 |
|------|------|
| `get_file` | 获取 Figma 文件信息 |
| `get_node` | 获取指定节点详情 + 组件树 JSON |
| `get_images` | 导出节点为图片 |

---

## 🎨 设计系统

### 主题配色（喜庆红金）

| Token | 浅色模式 | 暗色模式 | 用途 |
|-------|----------|----------|------|
| `--primary` | 喜庆红 | 亮红 | 主色调 |
| `--accent` | 金色 | 金色 | 强调色 |
| `--stock-up` | 红色 | 红色 | 涨/买入 |
| `--stock-down` | 绿色 | 绿色 | 跌/卖出 |
| `--risk-green` | 绿色 | 绿色 | 风险灯-正常 |
| `--risk-yellow` | 黄色 | 黄色 | 风险灯-谨慎 |
| `--risk-red` | 红色 | 红色 | 风险灯-禁止 |
| `--lucky-red` | 喜庆红 | 喜庆红 | 喜庆专用 |
| `--lucky-gold` | 金色 | 金色 | 喜庆专用 |

### Token 使用规则

1. **优先使用 shadcn 语义 token**：`bg-background`, `text-foreground`, `bg-card`, `border-border`
2. **其次使用 Tailwind 原子**：`px-4`, `gap-2`, `grid-cols-3`
3. **禁止新增自定义 CSS**

---

## 🛡 风控规则

| 条件 | 行为 | 说明 |
|------|------|------|
| `risk_light = RED` | 禁止新增 | 所有 ALLOW 降级为 BLOCK |
| `is_degraded = true` | 禁止 ALLOW | 数据降级时禁止操作 |
| `confidence < 0.6` | 禁止 ALLOW | 低置信度降级 |
| `risk_light = YELLOW` | 折减仓位 | 总仓 ≤60%, 单票 ≤10% |
| `bomb_rate > 0.3` | 降低仓位 | 总仓 ≤50%, 单票 ≤8% |
| `consecutive_losses ≥ 2` | 降低单票 | 单票 ≤6% |
| `consecutive_losses ≥ 3` | 大幅降仓 | 总仓 ≤40% |

> **重要**：任何策略或智能体建议都不能绕过 Policy Gate 的硬风控规则。

---

## 🚧 未完成功能

### 高优先级

| 功能 | 描述 | 状态 |
|------|------|------|
| **后端 API** | FastAPI/Node 后端服务 | 🔴 未开始 |
| **数据库** | SQLite/Postgres 数据持久化 | 🔴 未开始 |
| **真实数据接入** | adata/tushare 行情数据接入 | 🔴 未开始 |
| **策略草案生成** | 从内容资产生成策略 DSL 草案 | 🔴 未开始 |
| **DSL 校验器** | 策略 DSL 字段/阈值/依赖校验 | 🔴 未开始 |
| **策略卡编辑器** | 可视化策略配置表单 + dry-run 预览 | 🔴 未开始 |

### 中优先级

| 功能 | 描述 | 状态 |
|------|------|------|
| **MCP 真实 Transport** | 替换 Mock，接入真实 MCP Server | 🔴 未开始 |
| **模拟盘撮合逻辑** | 真实的模拟撮合与持仓计算 | 🔴 未开始 |
| **数据质量监控** | 延迟/缺字段/断流识别 | 🔴 未开始 |
| **快照系统** | input_bundle + strategy_run 快照 | 🔴 未开始 |
| **按市场状态分析** | Analytics 页面按 regime 分桶 | 🟡 部分完成 |
| **按题材分析** | Analytics 页面按 theme 分桶 | 🟡 部分完成 |

### 低优先级

| 功能 | 描述 | 状态 |
|------|------|------|
| **导出 CSV/JSON** | 复盘/统计数据导出 | 🔴 未开始 |
| **移动端适配优化** | 响应式布局细节优化 | 🟡 基本完成 |
| **E2E 测试** | Playwright/Cypress 端到端测试 | 🔴 未开始 |
| **CI/CD** | GitHub Actions 自动化部署 | 🔴 未开始 |
| **视频内容转写** | 视频自动转写为文本 | 🔴 未开始 |

---

## 📋 版本历史

### v0.1.0 (2026-01-22)

🎉 **首个版本发布**

#### 新增功能

- **前端框架**
  - Next.js 15 + TypeScript + Tailwind CSS 4.0 + shadcn/ui
  - 喜庆红金主题（适配 A 股涨停板风格）
  - 暗色/亮色主题切换

- **页面**
  - Dashboard（概览）：风险灯、市场状态、题材热度、策略统计、最近提示
  - Stock Pool（股池）：候选股票列表、筛选过滤
  - Stock Detail（个股详情）：触发条件、执行计划、题材梯队、历史回放
  - Strategy Factory（策略工厂）：内容资产管理、策略卡列表
  - Strategy Groups（策略组）：策略组合配置
  - Paper Trading（模拟盘）：下单、订单历史、交易统计
  - Portfolio（仓位）：持仓列表、风控状态
  - Analytics（统计分析）：策略/策略组表现
  - Review（复盘）：结果标注、归因分析
  - Settings（设置）：策略参数、数据源

- **MCP 插件系统**
  - 策略注册表 + MCP 客户端（Mock Transport）
  - 策略编排器（Orchestrator）：并行调用、加权聚合、去重
  - Policy Gate：硬风控裁决

- **智能体 MCP (daban-agents-mcp)**
  - `market_state`：市场状态解释
  - `theme_heat`：题材热度分析
  - `signal_explain`：信号卡生成
  - `risk_coach`：风控建议
  - `review_analyze`：复盘归因
  - `strategy_critic`：策略评估
  - `ensemble_judge`：并行策略仲裁

- **Figma MCP**
  - `get_file`：获取文件信息
  - `get_node`：获取节点详情 + 组件树 JSON
  - `get_images`：导出图片

- **Zod Schema**
  - InputBundle、StrategyResult、AggregatedResult
  - SignalCard、Portfolio、ReviewItem
  - AgentEnvelope、MCPError

- **测试**
  - Orchestrator + Policy Gate 测试用例（7 个场景）

#### 技术细节

- 116 个文件，约 18,800 行代码
- 23 个 shadcn/ui 组件
- 10 个页面路由
- 7 个 MCP 智能体工具
- 3 个 Figma MCP 工具

---

## 📄 License

MIT License

---

<p align="center">
  Made with ❤️ for A股打板交易者
</p>
