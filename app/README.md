# A股打板提示工具

智能打板策略提示与复盘系统，基于 shadcn/ui + Tailwind CSS + MCP 策略插件架构。

## 功能特性

- 📊 **Dashboard**: 风险灯、市场状态、题材热度、策略运行统计
- 📋 **股池**: 策略推荐候选股票，支持筛选和排序
- 📈 **个股详情**: 触发条件、执行计划、题材梯队、历史回放
- 💼 **模拟盘**: 模拟买卖，关联提示卡，统计盈亏
- 💰 **仓位管理**: 持仓列表、风控状态、仓位建议
- 🔄 **复盘**: 结果标注、归因分析、参数调整建议
- ⚙️ **设置**: 策略组配置、数据源管理

## 技术栈

### 前端
- **框架**: Next.js 15 (App Router) + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **数据请求**: TanStack Query
- **图标**: lucide-react
- **主题**: next-themes

### MCP 插件层
- **策略 MCP**: 荐股策略（reseal_v1、firstseal_guard_v1）
- **智能体 MCP**: 市场状态、题材分析、信号解释、风控建议、复盘归因
- **Figma MCP**: 设计稿到代码转换

## 快速开始

### 安装依赖

```bash
cd app
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建

```bash
npm run build
npm start
```

## 项目结构

```
app/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── dashboard/          # 概览页
│   │   ├── pool/               # 股池页
│   │   ├── stock/[symbol]/     # 个股详情页
│   │   ├── paper/              # 模拟盘页
│   │   ├── portfolio/          # 仓位页
│   │   ├── review/             # 复盘页
│   │   └── settings/           # 设置页
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 组件
│   │   ├── layout/             # 布局组件
│   │   ├── providers/          # Provider 组件
│   │   ├── dashboard/          # Dashboard 业务组件
│   │   ├── pool/               # 股池业务组件
│   │   ├── stock/              # 个股业务组件
│   │   ├── paper/              # 模拟盘业务组件
│   │   ├── portfolio/          # 仓位业务组件
│   │   ├── review/             # 复盘业务组件
│   │   └── settings/           # 设置业务组件
│   └── lib/
│       ├── schemas/            # Zod Schema 定义
│       ├── mcp/                # MCP 客户端和编排器
│       └── utils.ts            # 工具函数
mcp/
├── figma/                      # Figma MCP Server
│   ├── src/
│   │   ├── index.ts            # 入口
│   │   ├── client.ts           # Figma API 客户端
│   │   └── component-tree.ts   # 组件树生成器
│   └── README.md
└── agents/                     # 智能体 MCP Server
    ├── src/
    │   ├── index.ts            # 入口
    │   ├── types.ts            # 类型定义
    │   └── tools/              # 工具实现
    │       ├── market-state.ts
    │       ├── theme-heat.ts
    │       ├── signal-explain.ts
    │       ├── risk-coach.ts
    │       └── review-analyze.ts
    └── README.md
```

## MCP 策略接入

### 策略注册

在 `src/lib/mcp/registry.ts` 中注册策略：

```typescript
const strategy: StrategyConfig = {
  strategyId: "my_strategy_v1",
  name: "我的策略",
  version: "0.1.0",
  server: "my-strategy-mcp",
  tool: "run_strategy",
  enabled: true,
  weight: 0.5,
  timeoutMs: 5000,
  params: {
    // 策略参数
  },
};
```

### 策略输出格式 (StrategyResult)

```json
{
  "strategy_id": "my_strategy_v1",
  "version": "0.1.0",
  "ts": "2026-01-22T10:00:00+08:00",
  "recommendations": [
    {
      "symbol": "300xxx",
      "name": "示例股",
      "action": "ALLOW|WATCH|BLOCK",
      "score": 82.4,
      "confidence": 0.78,
      "tags": ["标签1", "标签2"],
      "position_hint": { "max_single_position": 0.10 },
      "triggers": [{ "name": "条件名", "status": "PASS", "detail": "说明" }],
      "plan": { "entry_note": "入场说明", "exit_rules": ["规则1", "规则2", "规则3"] },
      "risks": ["风险1"]
    }
  ],
  "warnings": [],
  "meta": { "params_used": {}, "runtime_ms": 150 }
}
```

## Figma MCP 使用

1. 配置 Figma Token：
   ```bash
   cd mcp/figma
   cp .env.example .env
   # 编辑 .env 填入 FIGMA_ACCESS_TOKEN
   ```

2. 安装依赖并启动：
   ```bash
   npm install
   npm start get_file <file_key>
   npm start get_node <file_key> <node_id>
   ```

3. 使用生成的组件树 JSON 辅助 Cursor 生成 shadcn 组件

## 设计系统规则

### Token 使用优先级

1. **shadcn 语义 token**: `bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`
2. **Tailwind 原子**: 布局/间距/尺寸 (`px-4`, `gap-2`, `grid`)
3. **禁止**: 新增自定义 CSS

### 股票颜色

- 涨: `text-stock-up` / `bg-stock-up`
- 跌: `text-stock-down` / `bg-stock-down`
- 绿灯: `text-risk-green` / `bg-risk-green`
- 黄灯: `text-risk-yellow` / `bg-risk-yellow`
- 红灯: `text-risk-red` / `bg-risk-red`

## 风控规则

| 条件 | 行为 |
|------|------|
| risk_light = RED | 禁止新增（全部 BLOCK） |
| is_degraded = true | 禁止 ALLOW（降级为 WATCH） |
| confidence < 0.6 | 禁止 ALLOW |
| risk_light = YELLOW | 总仓位 ≤ 60%，单票 ≤ 10% |
| bomb_rate > 0.3 | 总仓位 ≤ 50%，单票 ≤ 8% |
| 连亏 ≥ 2 | 单票 ≤ 6% |

## 测试

```bash
# 运行 Orchestrator 测试
npx tsx src/lib/mcp/__tests__/orchestrator.test.ts
```

## License

MIT
