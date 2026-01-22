# PRD（重构版）｜A股打板提示工具：shadcn + Tailwind + MCP 策略插件 + Figma MCP（v1.0）
日期：2026-01-22  
面向：个人自用（MVP），可迭代为多人/更自动化版本  

## 技术约束（强制）
- UI：**shadcn/ui + Tailwind CSS**
- 样式：**优先使用 shadcn 语义 token（bg-background / text-foreground / border-border / text-muted-foreground 等）**；语义 token 不足时才用 Tailwind 原子 token（px/gap/grid/width 等）citeturn0search1turn0search14  
- **禁止自定义 CSS**：不得新增自写 CSS 规则/文件；仅允许 shadcn 初始化所需的 `globals.css`（CSS 变量 token）作为基础设施，其余样式全部用 Tailwind className 完成citeturn0search1turn0search14  
- 图标：**lucide-react**（按需导入）citeturn0search5  
- 策略接入：以 **MCP 插件方式**引入荐股策略（可组合）  
- 需要提供 **Figma MCP 接入能力**（用于设计到代码/组件还原）citeturn0search0turn0search13  

---

## 1. 背景与重构目标
你已有能力：数据、情绪、热点分析、模拟盘操作、仓位/风控、复盘沉淀、提示卡/智能体。现要全量重构，核心提升：
- UI 视觉统一、可维护（shadcn 语义 token）
- 策略可插拔/可组合（MCP Strategy Service）
- 设计稿到代码（Figma MCP）
- 可回放/可复盘（snapshot + 策略运行记录）

### 1.1 目标（MVP）
1) **UI 重构**：移动端优先 + PC 自适应；信息密度可控；语义 token 还原。  
2) **策略插件化**：MCP 接入 reseal/首封等策略；支持策略组组合与聚合。  
3) **可回放**：每次推荐/提示卡都绑定 snapshot，复盘可对比策略与市场状态。  
4) **Figma MCP 可用**：能从 Figma 拉取页面/组件上下文，辅助 Cursor 生成 shadcn 组件结构。

### 1.2 非目标（MVP不做）
- 不自动交易、不接券商
- 不追求毫秒级高频（先分钟级特征）

---

## 2. 用户与核心使用路径
### 2.1 用户画像
- 你本人：盘中看热点/情绪 → 看股池 → 点开提示卡 → 按风控执行模拟盘 → 收盘复盘与参数调整

### 2.2 核心路径
1) Dashboard：风险灯/情绪/题材/策略组状态  
2) 股池：候选票（按策略组合得分排序）  
3) 个股详情：triggers/计划/仓位/风险/历史对照  
4) 模拟盘：按提示卡执行买卖并记录  
5) 复盘：回看提示卡→结果→归因→调整参数/组合  

---

## 3. 功能需求（重构后模块）
### 3.1 数据与特征（Data & Feature）
- 数据接入：adata（行情/基础）
- 特征工程：分钟级/日线/成交额/回撤/回封速度/开板次数等
- 快照：
  - `input_bundle` 快照（市场、题材、候选池、特征、仓位、数据质量）
  - `strategy_run`（策略入参hash、参数、输出、耗时）
- 数据质量：延迟/缺字段/断流识别 → `is_degraded`

### 3.2 市场情绪与热点（Market & Theme）
- `risk_light`：GREEN/YELLOW/RED  
- 情绪指标：涨停数、炸板率、连板高度、跌停数、指数短期走势
- 热点题材：主线/分支/退潮 + 龙头/梯队

### 3.3 策略引擎（MCP Strategy Plugins）【核心】
#### 3.3.1 插件化方式
- 策略以 MCP server/tools 接入；主 App 负责：注册表、并行调用、组合聚合、风控闸门。

#### 3.3.2 MVP 策略
- `reseal_v1`：回封主策略  
- `firstseal_guard_v1`：首封保守策略（强调仓控与失败条件）

#### 3.3.3 策略组合（Strategy Group）
- 策略组 = 多策略并行 + 聚合方式（加权/投票/过滤）
- MVP：加权合成 + 去重 + 冲突规则（ALLOW/WATCH/BLOCK）

### 3.4 执行建议与提示卡（Signal Cards）
- action：WATCH/ALLOW/BLOCK  
- triggers：PASS/FAIL/MISSING（阈值对比）  
- plan：仓位上限、入场说明、退出规则（≥3）  
- risks：风险点  
- 必须绑定 snapshot_id（复盘）

### 3.5 仓位/风控（Portfolio & Policy Gate）
- 仓位：持仓、现金、当日盈亏、连亏
- 硬闸门示例：
  - risk_light=RED → 禁新增（全降级 BLOCK）
  - is_degraded=true → 禁 ALLOW（降级 WATCH/BLOCK）
  - confidence<0.6 → 禁 ALLOW
- 输出：总仓上限/单票上限

### 3.6 模拟盘（Paper Trading）
- 买入/卖出/撤单（模拟）
- 订单/成交记录与提示卡关联（alert_id/snapshot_id）
- 统计：胜率、盈亏比、最大回撤、按策略/题材分组

### 3.7 复盘（Review）
- 结果标注：成功/失败/未执行  
- 归因：因子/市场状态/题材强弱  
- 参数建议：形成“调参备忘录”  
- 导出：JSON/CSV

---

## 4. UI/UX 需求（shadcn + Tailwind）
### 4.1 信息架构（导航）
- Dashboard（概览）
- Stock Pool（股池/推荐）
- Stock Detail（个股详情）
- Paper Trading（模拟盘）
- Portfolio（仓位）
- Review（复盘）
- Settings（策略组/参数/数据源/密钥）

### 4.2 设计系统规则（强制）
#### 4.2.1 Token 使用优先级
1) shadcn 语义 token class：bg-background / text-foreground / bg-card / border-border / text-muted-foreground…citeturn0search1turn0search14  
2) Tailwind 原子：布局/间距/尺寸（px-4 gap-2 grid…）  
3) 禁止：新增自定义 CSS、styled-components、emotion

#### 4.2.2 主题与暗色模式
- 使用 shadcn theming（CSS variables）实现 light/dark 切换citeturn0search1turn0search14  
- Settings 提供主题切换

#### 4.2.3 图标
- 仅使用 lucide-reactciteturn0search5  

### 4.3 组件清单（shadcn 优先）
- Layout：Sidebar / Topbar / Breadcrumb
- Data：Table、DataTable、Badge、Tooltip
- Cards：Card、HoverCard、Accordion
- Inputs：Input、Select、Combobox、DatePicker
- Feedback：Toast、Alert、Skeleton、Dialog/Drawer（移动端）

### 4.4 关键页面（MVP）
#### Dashboard
- 风险灯 + 市场状态（MarketState）
- 主线/退潮题材（ThemeHeat）
- 今日策略组运行统计（调用次数/拦截次数/平均分）

#### 股池（Stock Pool）
- 筛选：策略组、题材、风险灯、分数阈值
- 列表字段：symbol/name/tag/score/action/confidence
- 行为：点开详情；刷新提示卡

#### 个股详情（Stock Detail）
- 顶部：action + 仓位建议 + 一句话结论
- Tabs：triggers / plan / 题材梯队 / 历史回放

#### 模拟盘 / 仓位 / 复盘
- 模拟盘：按提示卡预填仓位与退出规则提示
- 复盘：提示卡 + 结果 + 归因 + 参数建议（可编辑）

---

## 5. 技术架构（建议）
### 5.1 前端
- Next.js App Router + TypeScript
- shadcn/ui + Tailwind
- Zustand（状态）+ TanStack Query（请求）+ TanStack Table（表格）
- next-themes（主题切换）

### 5.2 后端（可单体）
- FastAPI 或 Node（任选）
- SQLite/Postgres（MVP 可 SQLite）
- 定时任务：拉取数据/特征计算

### 5.3 MCP 策略插件层
- 策略以 MCP server/tools 提供统一接口
- Orchestrator 并行调用多个策略 tool 并聚合

---

## 6. MCP 封装：策略插件协议（必须）
### 6.1 StrategyResult（统一输出 Schema）
```json
{
  "strategy_id": "reseal_v1",
  "version": "0.1.0",
  "ts": "2026-01-12T10:05:00+08:00",
  "recommendations": [
    {
      "symbol": "300xxx",
      "name": "示例股",
      "action": "WATCH|ALLOW|BLOCK",
      "score": 82.4,
      "confidence": 0.78,
      "tags": ["回封","主线题材"],
      "position_hint": {"max_single_position": 0.10},
      "triggers": [{"name":"回封速度","status":"PASS|FAIL|MISSING","detail":"45s<=60s"}],
      "plan": {"entry_note":"...","exit_rules":["...","...","..."]},
      "risks": ["..."]
    }
  ],
  "warnings": [],
  "meta": {"params_used": {"max_bomb_rate": 0.30}, "runtime_ms": 23}
}
```

### 6.2 MCP Tools（每个策略/每个 server 必须实现）
- `describe_strategy(strategy_id)` → 元信息 + 参数 schema
- `run_strategy(strategy_id, input_bundle, params)` → StrategyResult

### 6.3 组合聚合（Orchestrator）
- 并行执行 → 合并 recommendations（按 symbol 去重）
- 分数：`score = Σ(weight_i * score_i)`
- action：任一 BLOCK → BLOCK；否则有 ALLOW 且 policy gate 允许 → ALLOW；否则 WATCH
- policy gate：risk_light/is_degraded/confidence/仓位上限取 min

---

## 7. Figma MCP 接入能力（必须）
### 7.1 目的与来源
Figma MCP server 为 AI agent 提供来自 Figma 文件/节点的上下文，帮助更准确地实现设计还原。citeturn0search0turn0search13  
备选也可用开源 figma-mcp-server（只读访问 Figma 文件/项目）。citeturn0search17  
若只用底层 REST API，可从 Files endpoints 获取文件 JSON/节点信息。citeturn0search3turn0search6  

### 7.2 项目交付要求
- 新增目录：`mcp/figma/`
- 提供：README、`.env.example`、启动脚本
- 最少提供 3 个工具封装：
  - `figma.get_file(file_key)`
  - `figma.get_node(file_key, node_id)`
  - `figma.get_images(file_key, node_ids[])`
- 输出产物：把 Figma 节点解析为“组件树 JSON”（包含文本/颜色/间距/圆角/层级），供 Cursor 生成 shadcn 页面骨架

### 7.3 Token 对齐规则（Figma → shadcn）
- 颜色：优先映射 shadcn token（background/foreground/primary/secondary/muted/accent/destructive/border/ring）citeturn0search1  
- 圆角：映射 Tailwind `rounded-*`
- 间距：映射 Tailwind spacing scale（px/py/gap/space）
- 字体：Tailwind font utilities 或 Next font

---

## 8. API/接口（建议）
- `POST /api/strategy/run_group`：输入 `{group_id, input_bundle}`，输出 `{aggregated_result, per_strategy_results[]}`
- `POST /api/paper/orders`：模拟盘下单
- `GET /api/review/alerts?date=...`：复盘列表
- `POST /api/review/label`：标注结果与归因

---

## 9. 测试与验收
### 9.1 UI 合规
- 扫描代码：禁止新增 CSS 文件/规则（除 shadcn globals.css）
- 页面 className 中 token 使用率：关键容器优先 bg-background/bg-card/text-foreground/border-border

### 9.2 策略插件与风控
- is_degraded=true → 禁 ALLOW
- risk_light=RED → 全部 BLOCK
- 多策略组合去重 + 加权正确
- 超时/失败策略不影响整体（降级但可用）

---

# 附录 A：给 Cursor 的交互内容（直接复制）
## A1. Project Rules（强制）
- Next.js App Router + TypeScript
- shadcn/ui + Tailwind；样式优先语义 token
- 禁止新增自定义 CSS（仅保留 shadcn globals.css 作为 token 基础）
- 图标只用 lucide-react
- 所有结构定义用 zod（`src/lib/schemas`）并做 API 合同校验
- 策略接入走 MCP client；统一输出 StrategyResult；Orchestrator 聚合；Policy Gate 最终裁决
- 提供 Figma MCP：`mcp/figma` 目录、env 模板、工具封装、README

## A2. 实施步骤（按顺序）
1) 初始化工程：Next.js + Tailwind + shadcn + lucide-react + next-themes + zod + tanstack query + zustand
2) 页面骨架（mock 数据）：/dashboard /pool /stock/[symbol] /paper /portfolio /review /settings
3) 建组件库：PageShell、MetricCard、DataTable、AlertCard、StrategyBadge
4) schema：InputBundle、StrategyResult、AggregatedResult、AlertCard（zod）
5) MCP：策略注册表 + MCP client（先 mock transport）+ Orchestrator + Policy Gate
6) 接入 reseal_v1 策略（作为第一个 MCP tool）
7) Figma MCP：`mcp/figma` + get_file/get_node/get_images + 组件树 JSON 生成脚本
8) 增加测试：orchestrator/policy gate（至少 5 个用例）
9) 文档：README（本地启动、策略接入、Figma MCP 用法）

## A3. 产出与验收
- `pnpm dev` 可运行；关键页移动端可用
- token 使用合规；无自定义 CSS
- 策略组可切换；推荐可生成提示卡；模拟盘可记录
- Figma MCP 目录可运行并能拉取节点生成组件树 JSON

---

# 附录 B：参考资料（实现时查阅）
- Figma 官方 MCP server 指南与 MCP 基本概念citeturn0search0turn0search13  
- shadcn/ui theming（语义 token 与 CSS 变量）citeturn0search1turn0search14  
- Figma REST API files endpoints（备选）citeturn0search3turn0search6  
- 开源 figma-mcp-server（备选）citeturn0search17  
