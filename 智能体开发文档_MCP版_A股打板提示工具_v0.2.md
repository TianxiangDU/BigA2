# 智能体开发文档（MCP 版）｜A股打板提示工具（v0.2）
日期：2026-01-22  
适用：你当前重构架构（shadcn/tailwind UI + MCP 策略插件 + 策略组编排 + 风控闸门 + 模拟盘 + 复盘）  
目标：把你之前的 **MarketState / ThemeHeat / SignalExplain / RiskCoach / ReviewAnalyst** 从“HTTP/平台工作流”升级为 **MCP 工具（tools）**，并明确它们如何接入现有系统（策略 MCP + Orchestrator + Policy Gate）。

> 本文档只关心“智能体（Agent）能力”，不替代策略 MCP（荐股策略/打分/候选池）——两者分层解耦。  
> - **策略 MCP**：产出 `StrategyResult`（推荐列表/分数/触发器）  
> - **智能体 MCP**：产出“解释/建议/复盘归因”的结构化结果（用于 UI 卡片、复盘、风险提示）

---

## 0. 更新说明：旧智能体如何加入新工具链
你之前的智能体（v0.1 / v0.2 文档）主要通过：
- 平台工作流（Coze/Dify/灵搭）+ HTTP 请求 App 接口，或
- 自建 HTTP Agent 服务（/v1/market/state /v1/signal/explain …）

**现在统一改为 MCP**：
- 智能体作为一个 **MCP Server**，对外暴露多个 tool（函数）
- 主 App（后端/编排层）作为 MCP Client：在合适的时机调用 tool，并把结果落库/推送 UI
- 这样你新增/替换某个智能体能力，只需要更新 MCP server 或 tool，不用改 UI/业务流程

### 0.1 新工具链里的位置（强烈建议按这个分层）
1) Data/Feature Engine（你已有）：生成 `input_bundle` + candidates  
2) **策略 MCP**（荐股策略插件）：输出 `StrategyResult[]`（可组合）  
3) **Orchestrator（主 App）**：聚合策略 → `AggregatedResult`  
4) **Policy Gate（主 App）**：硬风控裁决（红灯/降级/置信度等）  
5) **智能体 MCP**：
   - MarketState：解释市场状态与仓控上限（可辅助 UI）
   - ThemeHeat：解释题材与梯队（可辅助 UI）
   - SignalExplain：把“策略输出 + 市场状态 + 票特征”生成可展示的提示卡
   - RiskCoach：结合 portfolio 输出更保守的仓控建议
   - ReviewAnalyst：复盘归因与参数建议
6) UI（shadcn/tailwind）：展示卡片、列表、复盘与参数编辑

> 关键点：**硬裁决永远在 Policy Gate**。智能体只给建议/解释，不能绕过红灯/数据降级等硬规则。

---

## 1. 总体原则（必须遵守）
1) 智能体 **不直接拉行情**：只消费主 App 提供的 `input_bundle`、`strategy_result`、`alert/outcome` 等结构化输入。  
2) 智能体 **不下单**：只输出 `WATCH/ALLOW/BLOCK` + plan/risks；实际执行（模拟盘）由 App 处理。  
3) **可解释 & 可回放**：输出必须包含 triggers/reasons，并能关联 snapshot_id/alert_id。  
4) **降级优先**：缺字段/低置信度/数据延迟 → WATCH/BLOCK + warnings。  
5) **版本可控**：每个 tool 输出都带 `agent/version/schema_version`，便于复盘对比。  

---

## 2. MCP 智能体 Server 设计
### 2.1 Server 名称与职责
建议单独建一个 server：`daban-agents-mcp`  
暴露 5 个核心 tools：
- `market_state`（MarketState）
- `theme_heat`（ThemeHeat）
- `signal_explain`（SignalExplain）
- `risk_coach`（RiskCoach）
- `review_analyze`（ReviewAnalyst）

> 也可以按域拆成多个 server，但 MVP 建议一个 server 先跑通。

### 2.2 Tool 统一封装（Envelope）
所有 tool 返回都建议包一层 Envelope，便于主 App 统一落库：
```json
{
  "type": "MarketState|ThemeHeat|SignalExplain|RiskCoach|ReviewAnalyst",
  "payload": { },
  "meta": { "agent":"...", "version":"0.2.0", "ts":"...", "confidence":0.0, "warnings":[] }
}
```

### 2.3 通用错误返回（建议）
当工具调用失败（模型异常/超时/输入不合法）时，返回：
```json
{
  "type": "Error",
  "error": {
    "code": "INVALID_INPUT|TIMEOUT|MODEL_ERROR|INTERNAL",
    "message": "human readable",
    "retryable": true
  },
  "meta": { "agent":"...", "version":"0.2.0", "ts":"..." }
}
```
主 App 处理策略：
- 可重试：最多 1~2 次
- 不可重试：降级为默认解释/空输出，并写入 warnings

---

## 3. 输入协议：智能体需要什么数据
### 3.1 InputBundle（沿用）
智能体依赖：
- `market`：risk_light、bomb_rate、limit_up_count、max_streak、down_limit_count…
- `themes`：题材列表（可为空）
- `candidates`：候选池（含 features/scores）
- `portfolio`：持仓/现金/连亏等（RiskCoach/复盘用）
- `strategy_context.data_quality`：is_degraded、data_lag_sec、missing_fields（降级用）

### 3.2 StrategyResult / AggregatedResult（新增）
当你引入“策略 MCP 插件化”后，SignalExplain 不应该再自己“推断推荐”，而应该用：
- **策略输出**（单策略 StrategyResult）或
- **聚合输出**（AggregatedResult：多策略组合后的最终推荐）

因此 SignalExplain 的输入建议包含：
- `input_bundle`
- `symbol`
- `aggregated_item`（该票在聚合结果中的条目：score/action/tags/triggers/plan_hint）
- `policy_decision`（Policy Gate 的最终裁决：allow_new_trades/max_position 等）

---

## 4. Tools 详细定义（I/O + Schema + 示例）
> 下面的 Schema 是“落库/UI”导向的结构，Cursor 开发时建议用 zod 校验（与 PRD 的 schema 目录一致）。

### 4.1 tool：market_state
#### 入参
```json
{
  "input_bundle": { "market": { }, "strategy_context": { "data_quality": { } } }
}
```
#### 出参（payload）
```json
{
  "mode": "STRONG|DIVERGENCE|WEAK|CHAOS",
  "risk_light": "GREEN|YELLOW|RED",
  "reasons": [{"key":"bomb_rate","value":0.22,"rule":"<=0.30 => ok"}],
  "suggested_risk": { "allow_new_trades": true, "max_total_position": 0.6, "max_single_position": 0.15 }
}
```
#### 行为规则（强约束）
- `data_quality.is_degraded=true` → `allow_new_trades=false` 或大幅下调仓位 + warnings

### 4.2 tool：theme_heat
#### 入参
```json
{ "input_bundle": { "themes": [], "market": {} } }
```
#### 出参（payload）
```json
{
  "top_themes":[{"name":"AI应用","tier":"MAIN","strength":0.78,"leaders":["300xxx"],"notes":"…"}],
  "avoid_themes":[{"name":"超跌反弹","reason":"退潮/炸板率高"}]
}
```

### 4.3 tool：signal_explain（核心）
#### 入参（推荐）
```json
{
  "symbol": "300xxx",
  "input_bundle": { },
  "aggregated_item": {
    "score": 82.4,
    "action": "ALLOW|WATCH|BLOCK",
    "confidence": 0.78,
    "tags": ["回封","主线题材"],
    "triggers": [{"name":"回封速度","status":"PASS","detail":"45s<=60s"}],
    "plan_hint": {"max_single_position": 0.10}
  },
  "policy_decision": {
    "allow_new_trades": true,
    "max_total_position": 0.6,
    "max_single_position": 0.10,
    "reason": "YELLOW灯，折减仓位"
  }
}
```
#### 出参（payload）
```json
{
  "symbol":"300xxx",
  "strategy_group_id":"default",
  "action":"WATCH|ALLOW|BLOCK",
  "one_liner":"黄灯分歧，满足回封速度与稳定性，小仓试错，开板30秒不回封即撤",
  "triggers":[{"name":"回封速度","status":"PASS","detail":"45s<=60s"}, {"name":"风险灯","status":"PASS","detail":"YELLOW => 限仓"}],
  "plan":{
    "max_single_position":0.10,
    "entry_note":"仅在再次回封且成交额不缩量时执行；不追高超预期拉升段",
    "exit_rules":[
      "开板30s不回封=>放弃/减仓",
      "pullback_5m>0.18=>停止追/撤退",
      "risk_light变RED=>停止新增"
    ]
  },
  "risks":["题材分歧扩大将提高炸板概率"],
  "snapshot_hint":{"should_create_snapshot":true,"snapshot_tags":["signal_card","300xxx"]}
}
```
#### 强约束
- 若 `policy_decision.allow_new_trades=false` → action 不得为 ALLOW
- 若 `data_quality.is_degraded=true` → action 不得为 ALLOW，且 warnings 必须说明缺字段/延迟
- triggers 必须包含：环境（risk_light/炸板率/数据质量）+ 至少 4 个票面/策略因子

### 4.4 tool：risk_coach（可选但很实用）
#### 入参
```json
{ "input_bundle": { "portfolio": {}, "market": {}, "strategy_context": {} } }
```
#### 出参（payload）
```json
{
  "allow_new_trades": true,
  "max_total_position": 0.5,
  "max_single_position": 0.08,
  "notes":["连亏=2，降低单票仓位","YELLOW灯，折减仓位"]
}
```
> 主 App 取 `min(policy_gate, risk_coach)` 作为最终仓控。

### 4.5 tool：review_analyze（可选）
#### 入参
```json
{
  "alert_id":"a_20260122_001",
  "snapshot": { },
  "signal_card": { },
  "outcome": { "label":"SUCCESS|FAIL|SKIP", "pnl": 0.03, "notes":"…" }
}
```
#### 出参（payload）
```json
{
  "alert_id":"a_20260122_001",
  "label":"FAIL",
  "root_causes":[{"factor":"市场退潮","detail":"炸板率从0.22升至0.38"}],
  "suggestions":[
    "YELLOW灯且bomb_rate>0.30时，将max_single_position下调到0.06",
    "reseal_speed_sec阈值从60收紧到45（仅在强势日执行）"
  ],
  "summary":"环境恶化导致失败，策略阈值可在分歧日收紧"
}
```

---

## 5. 智能体如何接入你当前项目（接入点清单）
> 你现在已经在做：MCP 策略插件 + Orchestrator + Policy Gate + shadcn UI。下面是“插入智能体 MCP”的最小改动方案。

### 5.1 后端新增：Agent MCP Client（与 Strategy MCP Client 并列）
- `src/server/mcp/clients/strategyClient.ts`
- `src/server/mcp/clients/agentClient.ts`  ✅新增
- 两者都实现：`callTool(serverName, toolName, args, timeoutMs)`

### 5.2 新增：Agent Registry（可选，但推荐）
与策略 registry 类似：
```yaml
agents:
  - agent_id: market_state
    server: daban_agents
    tool: market_state
    enabled: true
    timeout_ms: 2500
  - agent_id: signal_explain
    server: daban_agents
    tool: signal_explain
    enabled: true
    timeout_ms: 4000
```
好处：可热插拔/灰度/快速关停。

### 5.3 调用时机（非常具体）
- Dashboard：
  - 每 30~60 秒：调用 `market_state`（可缓存）
  - 每 60~120 秒：调用 `theme_heat`（可缓存）
- 股池（Pool）：
  - 运行策略组（策略 MCP）得到 `AggregatedResult`
  - **不要**为所有票都生成提示卡（成本高）
  - MVP：只对 Top N（例如 10）或用户点击的 symbol 调用 `signal_explain`
- 个股详情：
  - 用户进入详情页：调用 `signal_explain(symbol)`（或读取缓存）
- 模拟盘下单前：
  - 调用 `risk_coach` 给出更保守仓控提示
- 复盘：
  - 用户标注 outcome 后：调用 `review_analyze` 生成归因与调参建议

### 5.4 数据落库（必须）
- `agent_runs`：记录 tool、输入hash、输出、耗时、warnings、版本
- `signal_cards`：提示卡实体（关联 alert_id/snapshot_id）
- `review_notes`：复盘归因与建议

---

## 6. 与 UI（shadcn/tailwind）对接的输出规范
为保证 UI 组件渲染稳定：
- triggers：用于 DataTable（列：name/status/detail）
- plan.exit_rules：用于 Accordion 列表
- risks/warnings：用于 Alert/Badge
- one_liner：用于 Card header 的摘要

> 所有文本字段建议限制长度（例如 200~400 字以内），避免移动端溢出。超长内容放到“展开”。

---

## 7. 测试用例（必须更新并落地自动化）
### 7.1 单 tool 测试（输入固定 fixture）
- market_state：GREEN/YELLOW/RED + is_degraded 组合
- signal_explain：
  - policy_decision.allow_new_trades=false → 不得 ALLOW
  - missing_fields 包含关键字段 → triggers=MISSING + warnings
- risk_coach：连亏、回撤、红灯环境

### 7.2 集成测试（Orchestrator + Policy Gate + SignalExplain）
- 流程：input_bundle → 策略 MCP（mock）→ 聚合 → policy gate → signal_explain
- 断言：最终 action 与仓控上限正确，且 signal_explain 输出与裁决一致

### 7.3 失败与降级测试
- MCP 调用超时 → 使用默认解释/空输出，并写 warnings
- 模型错误 → retry 1 次，仍失败则降级

---

## 8. 版本与兼容性
- `daban-agents-mcp`：SemVer（0.x 期间允许小幅变动，但尽量向后兼容）
- 每个 tool 输出 meta 中带：`agent/version/ts`，落库用于回放对比
- Schema 变更策略：只新增字段，不删除/不改语义；重大变更升 major

---

## 9. 交付物清单（本次更新你需要拿到的）
1) **更新后的智能体 MCP 开发文档（本文）** ✅  
2) `daban-agents-mcp` server 设计（tools 列表、I/O、错误、版本） ✅  
3) 主 App 接入点清单（何时调用、如何缓存、如何落库） ✅  
4) 测试用例清单（unit + integration） ✅  

---

# 附录：迁移指导（从旧 HTTP Agent/平台工作流迁移到 MCP）
1) 把原来的 `/v1/*` 端点定义，改成 MCP tools（同名即可）  
2) 原本 Coze/Dify 工作流里的“HTTP GET input_bundle → LLM → HTTP POST apply_output”改为：  
   - 主 App 直接调用 MCP tool 获取结构化输出  
   - 若仍想保留平台（可选）：平台也可以作为一个“外部 agent”，但主链路建议走 MCP 以降低耦合  
3) 保持 `input_bundle` 不变（迁移成本最低）  
4) 新增 `AggregatedResult + policy_decision` 作为 signal_explain 的增强输入（提升一致性）  

