# PRD（新版）｜A股打板提示工具：多模态策略卡工厂 + MCP 策略/智能体 + 策略组合模拟盘评估（v1.1）
日期：2026-01-22  
面向：个人自用（MVP），可迭代为多人/更自动化版本

> 本 PRD 是你当前重构方向（shadcn + Tailwind + lucide-react + Figma MCP + MCP 插件化）的“升级版”：把“文本/视频/图片等多模态策略内容”做成**可配置策略卡**，支持随时新建/发布/组合，并通过**模拟盘归因统计**看到每个策略/组合的胜率情况；引入模型能力用于**策略评估（Critic）**与**多策略并行仲裁（Judge）**，但最终硬风控仍由主 App 的 Policy Gate 决定。

---

## 0. 强制技术与设计约束（必须执行）
### 0.1 UI 技术栈
- Next.js App Router + TypeScript
- UI：shadcn/ui + Tailwind
- 图标：lucide-react

### 0.2 样式与 token 规则
- 样式优先级：
  1) shadcn 语义 token（bg-background / text-foreground / border-border / bg-card / text-muted-foreground …）
  2) Tailwind 原子 token（布局/间距/尺寸，如 px-4、gap-2、grid-cols-…）
- 禁止：新增自定义 CSS 规则/文件（仅允许 shadcn 初始化所需 globals.css 作为 CSS 变量 token 基础设施）

### 0.3 可接入 Figma MCP（必须）
- 项目需提供 `mcp/figma` 目录 + README + `.env.example` + 最小工具封装（get_file/get_node/get_images 或等价）
- 目标：支持从 Figma 拉取页面/组件上下文，辅助 Cursor 还原页面结构与 token 映射（不是强制自动生成 UI，但要能接入并跑通）

---

## 1. 背景与目标
你现有框架已包含：数据、情绪、热点分析、模拟盘、仓位风控、复盘沉淀、策略 MCP 插件化、智能体 MCP 解释层。  
新增目标：把“策略来源”扩大到**多模态内容（视频/图片/文本）**，并提供一个“策略卡工厂”，实现：
- 任何时候新增策略：上传/粘贴内容 → 生成策略草案 → 校验 → 发布 → 加入策略组
- 多策略并行：组合策略组输出推荐与提示卡
- 模拟盘交易：按策略/组合归因，统计胜率/盈亏比/回撤，并用于模型评估与调参建议

---

## 2. 产品范围与非目标
### 2.1 本期范围（MVP）
- 多模态策略内容入库（文本/图片/视频链接）
- 策略卡（DSL）生成/编辑/发布/版本管理
- 策略组（组合）配置与运行（并行 + 聚合 + 冲突规则）
- 模型能力：策略评估（Critic）+ 并行策略仲裁（Judge）
- 模拟盘：下单/成交/持仓/平仓/归因/统计
- 复盘：按策略/组合/市场状态分桶表现，输出调参建议（可用模型辅助）

### 2.2 非目标（MVP 不做）
- 不自动真实交易，不接券商
- 不做盘口队列级别高频判断（先分钟级特征）
- 不要求视频自动转写一步到位（MVP 可允许你粘贴字幕/要点）

---

## 3. 核心概念（对象模型）
### 3.1 Content Asset（多模态内容资产）
- 来源：文本、图片、视频（链接/文件）、PDF/网页（可选）
- 用途：作为策略卡的“来源证据链”，便于回看与复现
- 字段：id、type、title、raw_text、attachments、source_url、notes、created_at

### 3.2 Strategy Card（策略卡，版本化）
- 本质：可执行 DSL（JSON/YAML）+ 可视化配置表单
- 状态：DRAFT / PUBLISHED / DEPRECATED
- 版本：SemVer（0.x 期间允许小改，但发布即固化）
- 输出：统一 StrategyResult（供策略组合与提示卡使用）

### 3.3 Strategy Group（策略组，组合）
- 多策略并行运行
- 聚合规则：加权/投票/过滤/冲突裁决
- 可按市场状态（GREEN/YELLOW/RED 或 STRONG/DIVERGENCE/WEAK/CHAOS）切换策略组

### 3.4 Signal Card（提示卡）
- 基于策略输出 + 风控裁决 + 智能体解释生成
- 绑定 snapshot_id / alert_id
- UI 展示：triggers / plan / risks / warnings

### 3.5 Paper Trading（模拟盘）
- 订单/成交/持仓/平仓
- 关键：每笔交易必须带“归因”：strategy_id、strategy_group_id、alert_id、snapshot_id

---

## 4. 用户流程（MVP）
### 4.1 新建策略卡（多模态 → 可配置）
1) 进入「策略工厂」→ 新建内容资产（粘贴文本/上传图片/填视频链接/粘贴字幕）
2) 点击「生成策略草案」：模型抽取出 StrategyDraft（结构化规则）
3) 系统运行“规则校验器”：字段/阈值/依赖 feature 白名单校验
4) 进入「策略卡编辑器」：手动调整阈值、权重、仓位、退出规则、禁做条件
5) 发布（PUBLISHED）：生成新版本；可回滚

### 4.2 组合策略并运行
1) 进入「策略组」→ 选择启用策略卡、设置权重与聚合规则
2) 盘中运行：生成 input_bundle → 并行跑策略卡（MCP）→ 聚合 → Policy Gate → 输出推荐列表/提示卡

### 4.3 模拟盘交易与统计
1) 在股池/个股详情看到提示卡 → 一键进入模拟下单
2) 下单/成交/平仓自动记录归因（策略卡/策略组）
3) 在「统计」页面查看：策略卡/策略组胜率、盈亏比、回撤、分市场状态表现

### 4.4 策略评估与调参
1) 在策略卡详情页点击「策略评估」：调用 Critic 输出风险点与调参建议
2) 在策略组详情页点击「组合仲裁」：Judge 输出冲突解释与建议组合权重（仅建议）
3) 你手动改参数 → 发布新版本 → 继续跑模拟盘对比

---

## 5. 功能需求拆解
### 5.1 策略工厂（Strategy Factory）
#### 5.1.1 内容资产管理（Content Assets）
- 新建/编辑/删除（软删）
- 支持类型：TEXT / IMAGE / VIDEO_LINK / PDF（可选）
- 关联：一个策略卡可引用多个内容资产（证据链）
- MVP：视频允许你粘贴字幕/要点（raw_text），图片允许你输入说明（notes）

#### 5.1.2 策略草案生成（Strategy Draft Generation）
- 输入：content_asset_ids[] + 可选“策略类型”（回封/首封/低吸/趋势等）
- 输出：StrategyDraft（结构化 DSL 草案）
- 强约束：草案必须可被校验器校验，不通过则返回缺失项清单

#### 5.1.3 策略卡编辑器（可视化配置）
- 表单字段：universe / market_gates / stock_gates / triggers / scoring / execution（见 DSL）
- 支持：新增/删除规则、调整阈值、权重、优先级
- 预览：在右侧实时预览“对某个示例 input_bundle 的运行结果”（dry-run）

#### 5.1.4 版本与发布
- DRAFT → PUBLISHED（生成新版本号）
- PUBLISHED 可复制为新 DRAFT（用于迭代）
- DEPRECATED：不可在策略组中启用

---

### 5.2 策略运行（Strategy Runner via MCP）
#### 5.2.1 DSL（策略卡配置格式）
策略卡采用 JSON（存储）+ 可导出 YAML（可选）。结构：
- universe：适用范围与过滤
- market_gates：市场硬门槛（FAIL 即禁止 ALLOW）
- stock_gates：个股硬门槛
- triggers：可解释触发器（PASS/FAIL/MISSING）+ 权重
- scoring：分数计算规则（base/bonus/penalty/cap）
- execution：仓位建议、入场说明、退出规则、禁做条件
- explain：来源引用（content assets）

#### 5.2.2 StrategyResult（统一输出）
每个策略卡运行必须输出：
- recommendations[]：symbol、action、score、confidence、tags、position_hint、triggers、plan、risks
- warnings、meta.params_used、meta.runtime_ms

#### 5.2.3 运行模式
- 单票运行：用于详情页/编辑器 dry-run
- 批量运行：对候选池 candidates 并行跑（受限于性能，建议先跑 TopK）

---

### 5.3 策略组合（Strategy Group Orchestrator）
#### 5.3.1 策略组配置
- group_id、name、enabled_strategies[]（含 weight、override_params）
- combine_method：WEIGHTED / VOTE（MVP 先 WEIGHTED）
- conflict_policy：ANY_BLOCK_BLOCK / REQUIRE_N_ALLOW / etc（MVP 用默认）
- regime_routing（可选）：不同 market_state 使用不同策略组

#### 5.3.2 聚合规则（MVP 默认）
- 同一 symbol 分数：score = Σ(weight_i * score_i)
- action：
  - 任一 BLOCK → BLOCK
  - 否则若存在 ALLOW 且 Policy Gate 允许 → ALLOW
  - 否则 WATCH
- 仓位：min(各策略 position_hint, policy_limit) 并按风险灯折减

---

### 5.4 模型能力（MCP 智能体扩展）
> 模型只做“建议/解释/评估/仲裁”，最终硬裁决由 Policy Gate 执行。
#### 5.4.1 Strategy Critic（策略评估）
- 输入：StrategyCard DSL + 最近统计摘要（可选）+ 适用场景偏好
- 输出：
  - 风险点（过拟合、条件矛盾、依赖特征不可得、不可解释）
  - 调参建议（阈值收紧/放宽、权重调整）
  - 建议适用 market regime（强势/分歧/退潮）
  - 建议补充测试用例

#### 5.4.2 Ensemble Judge（并行策略仲裁）
- 输入：同一 symbol 的 per-strategy outputs + market_state + policy_decision
- 输出：
  - 推荐 action（建议值）与解释
  - 冲突原因（A 允许 B 阻止）
  - 建议仓位（取 min + 折减）
> 主 App 可把 Judge 输出作为“解释层”，但不替代聚合规则（可用于 UI 展示与人工决策）。

#### 5.4.3 Signal Explain（提示卡生成）
- 输入：aggregated_item + policy_decision + input_bundle
- 输出：可渲染 Signal Card（one_liner、triggers、plan、risks、warnings、snapshot_hint）

#### 5.4.4 Review Analyze（复盘归因）
- 输入：alert/snapshot + outcome + 运行时市场状态
- 输出：root_causes + suggestions + summary（并可建议生成新版本策略参数）

---

### 5.5 Policy Gate（硬风控闸门）
强制规则（MVP）：
- market.risk_light == RED → 禁新增（所有 ALLOW 降级 BLOCK）
- data_quality.is_degraded == true → 禁 ALLOW（降级 WATCH/BLOCK）
- confidence < 0.6 → 禁 ALLOW
- 仓位上限：总仓/单票取 min，并按风险灯折减
> 任何策略或智能体建议都不能绕过 Policy Gate。

---

### 5.6 模拟盘（Paper Trading）与归因统计
#### 5.6.1 模拟盘操作
- 下单：buy/sell/cancel（模拟）
- 成交：按简化撮合（MVP：以当前价成交或按你定义的成交逻辑）
- 持仓：实时更新均价/浮动盈亏
- 平仓：生成 outcome（SUCCESS/FAIL/SKIP + pnl）

#### 5.6.2 归因（必须）
每笔订单/成交/平仓必须写入：
- strategy_id（可空：手动交易）
- strategy_version
- strategy_group_id
- alert_id
- snapshot_id

#### 5.6.3 统计面板（必须）
- 按策略卡：胜率、平均收益、盈亏比、最大回撤、交易次数、被风控拦截率
- 按策略组：同上 + 策略贡献度（每个策略对组合的贡献）
- 分桶：按 market_state/risk_light、按题材、按时间段

---

## 6. 信息架构与页面（shadcn 组件化）
### 6.1 导航
- Dashboard（概览）
- Stock Pool（股池）
- Stock Detail（个股）
- Strategy Factory（策略工厂）
- Strategy Groups（策略组）
- Paper Trading（模拟盘）
- Analytics（统计）
- Review（复盘）
- Settings（设置/密钥/MCP）

### 6.2 关键页面说明
#### 6.2.1 Strategy Factory
- Content Assets：列表/详情/新建
- Draft Generator：选择资产 → 生成草案 → 校验结果（缺失项提示）
- Strategy Card Editor：表单 + 右侧 dry-run 预览（某个 input_bundle fixture）
- Versions：版本列表、发布、回滚、弃用

#### 6.2.2 Strategy Groups
- 列表：策略组、启用策略、权重、聚合方式
- 详情：组合运行记录、被风控拦截次数、组合胜率概览
- 一键运行：对当前候选池执行策略组（写入 run 记录）

#### 6.2.3 Analytics（统计）
- Tabs：By Strategy / By Group / By Regime / By Theme
- 表格 + 卡片指标（MetricCard + DataTable）
- 支持导出 CSV/JSON

#### 6.2.4 Stock Pool / Stock Detail / Paper Trading / Review
- 复用此前 v1.0 结构：列表 → 详情 → 提示卡 → 模拟下单 → 复盘归因

---

## 7. 数据结构（建议：SQLite/Postgres）
> 仅列 MVP 必需表（字段可按实现细化）。

### 7.1 content_assets
- id, type, title, raw_text, source_url, attachments_json, notes, created_at

### 7.2 strategy_cards
- strategy_id, name, status, current_version, created_at, updated_at

### 7.3 strategy_card_versions
- strategy_id, version, dsl_json, source_asset_ids_json, published_at

### 7.4 strategy_groups
- group_id, name, config_json, created_at

### 7.5 strategy_runs
- run_id, group_id, ts, input_hash, input_snapshot_id, per_strategy_results_json, aggregated_result_json, runtime_ms, warnings_json

### 7.6 alerts (signal cards)
- alert_id, symbol, ts, snapshot_id, group_id, final_action, signal_card_json, policy_decision_json

### 7.7 paper_orders / paper_trades / paper_positions
- orders: order_id, ts, symbol, side, qty, price, status, alert_id, snapshot_id, strategy_id, group_id
- trades: trade_id, order_id, ts, fill_price, fill_qty, pnl_delta, same attribution fields
- positions: symbol, qty, avg_cost, unrealized_pnl, attribution summary (optional)

### 7.8 outcomes (for review)
- outcome_id, alert_id, label(SUCCESS/FAIL/SKIP), pnl, notes, created_at

---

## 8. API（MVP 建议）
- POST /api/content-assets
- POST /api/strategy-cards/draft (asset_ids -> draft)
- POST /api/strategy-cards/validate
- POST /api/strategy-cards/publish
- POST /api/strategy-groups
- POST /api/strategy/run-group (group_id + input_bundle -> aggregated + per-strategy)
- POST /api/alerts/create (symbol -> signal card)
- POST /api/paper/orders
- POST /api/paper/close-position
- GET  /api/analytics/strategy
- GET  /api/analytics/group
- POST /api/review/analyze (alert_id + outcome -> review notes)

---

## 9. MCP 交付要求（必须）
### 9.1 Strategy MCP（策略运行）
- tools：
  - describe_strategy(strategy_id, version?)
  - run_strategy(strategy_id, version, input_bundle, params_override?)

### 9.2 Agent MCP（解释/评估/仲裁/复盘）
- tools：
  - market_state(input_bundle)
  - signal_explain(symbol, input_bundle, aggregated_item, policy_decision)
  - strategy_critic(strategy_card_dsl, stats_summary?)
  - ensemble_judge(symbol, per_strategy_items, market_state, policy_decision)
  - review_analyze(alert_snapshot, outcome)

### 9.3 Figma MCP
- `mcp/figma` 可运行、可调用最小工具，并输出组件树 JSON（供 Cursor 使用）

---

## 10. 验收标准（MVP）
1) 能从多模态内容创建 content_asset，并生成策略草案（draft），校验器能指出缺失字段/不可用 features。  
2) 策略卡可编辑、发布、版本化；策略组可配置并运行，输出统一结果。  
3) Policy Gate 生效：红灯/降级/低置信度场景不出现 ALLOW。  
4) 模拟盘支持交易归因：每笔交易可追溯到策略卡/策略组/提示卡。  
5) 统计面板可查看每个策略卡/策略组的胜率、盈亏比、回撤，并支持分桶（risk_light/market_state）。  
6) MCP：策略 MCP 与智能体 MCP 均可被主 App 调用；Figma MCP 目录可跑通并能拉取节点信息。  
7) UI 合规：不新增自定义 CSS，关键页面使用 shadcn 语义 token 作为颜色/边框基础。

---

# 附录 A：给 Cursor 的交互内容（直接复制）
## A1. Project Rules（强制）
- Next.js App Router + TypeScript
- shadcn/ui + Tailwind：样式优先语义 token，语义不足再用 Tailwind 原子
- 禁止新增自定义 CSS（仅保留 shadcn globals.css）
- 图标只用 lucide-react
- 所有核心 schema 用 zod（src/lib/schemas），API 输出必须校验
- 策略 DSL 必须通过校验器（feature key 白名单 + op/value 类型匹配）
- 策略运行通过 MCP client（Strategy MCP）；解释/评估/仲裁/复盘通过 Agent MCP；Figma MCP 需提供可运行目录

## A2. 开发任务拆解（按顺序）
### Phase 0：工程初始化
1) Next.js + Tailwind + shadcn + lucide-react + next-themes + zod + tanstack query + zustand + tanstack table
2) Layout 组件：AppShell、Sidebar、Topbar、PageShell

### Phase 1：Schema & 数据表
1) zod：ContentAsset、StrategyCard、StrategyCardDSL、StrategyResult、AggregatedResult、SignalCard、PaperOrder/Trade/Position、Outcome
2) DB：SQLite（MVP）建表与迁移脚本

### Phase 2：策略工厂
1) Content Assets CRUD
2) Draft Generator（先走 Agent MCP 的 strategy_critic/或 strategy_from_content 的 tool；若未实现可先 mock）
3) DSL 校验器（白名单校验 + 类型校验）
4) Strategy Card Editor（表单 + dry-run 预览）
5) 发布/版本管理

### Phase 3：策略组与运行
1) Strategy Groups CRUD（权重/聚合配置）
2) Strategy Runner：调用 Strategy MCP 跑策略卡（批量）
3) Orchestrator 聚合 + Policy Gate 裁决
4) 生成提示卡：调用 Agent MCP 的 signal_explain（按 TopN 或点击触发）
5) 运行记录 strategy_runs 落库

### Phase 4：模拟盘与归因
1) 下单/成交/持仓/平仓
2) 强制归因字段写入（strategy_id/version/group_id/alert_id/snapshot_id）
3) 复盘 outcome 标注 + review_analyze（Agent MCP）

### Phase 5：统计面板
1) Analytics：By Strategy / By Group / By Regime / By Theme
2) 指标：胜率、盈亏比、最大回撤、交易次数、拦截率
3) 导出 CSV/JSON

### Phase 6：Figma MCP
1) 新增 mcp/figma 目录、README、env 模板、工具封装
2) 输出组件树 JSON，用于辅助 UI 还原

## A3. 产出与验收
- pnpm dev 可运行
- 关键页面移动端可用，且无自定义 CSS
- 策略卡可创建/发布/加入策略组；策略组可运行并生成推荐/提示卡
- 模拟盘交易带归因；统计面板能看到策略/组合胜率表现
- MCP（策略/智能体/Figma）均可被调用且有 README

