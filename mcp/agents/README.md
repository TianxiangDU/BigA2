# 打板智能体 MCP Server (daban-agents-mcp)

打板智能体 MCP Server 提供市场状态解释、题材分析、信号解释、风控建议和复盘归因等 AI 能力。

## 功能

| Tool | 说明 | 用途 |
|------|------|------|
| `market_state` | 市场状态解释 | Dashboard 显示 |
| `theme_heat` | 题材热度分析 | Dashboard/股池 |
| `signal_explain` | 信号卡生成 | 个股详情页 |
| `risk_coach` | 风控建议 | 模拟盘下单前 |
| `review_analyze` | 复盘归因 | 复盘页标注后 |

## 安装

```bash
cd mcp/agents
npm install
```

## 配置

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

## 启动

```bash
npm start
```

## 工具详情

### market_state

**输入：**
```json
{
  "input_bundle": {
    "market": { "risk_light": "YELLOW", "bomb_rate": 0.18, ... },
    "strategy_context": { "data_quality": { "is_degraded": false } }
  }
}
```

**输出：**
```json
{
  "type": "MarketState",
  "payload": {
    "mode": "DIVERGENCE",
    "risk_light": "YELLOW",
    "reasons": [...],
    "suggested_risk": { "allow_new_trades": true, "max_total_position": 0.6 }
  },
  "meta": { "agent": "market_state", "version": "0.2.0", "ts": "..." }
}
```

### signal_explain

**输入：**
```json
{
  "symbol": "300xxx",
  "input_bundle": { ... },
  "aggregated_item": { "score": 82.4, "action": "ALLOW", ... },
  "policy_decision": { "allow_new_trades": true, ... }
}
```

**输出：**
```json
{
  "type": "SignalExplain",
  "payload": {
    "symbol": "300xxx",
    "action": "ALLOW",
    "one_liner": "黄灯分歧，满足回封速度与稳定性，小仓试错",
    "triggers": [...],
    "plan": { "max_single_position": 0.1, "entry_note": "...", "exit_rules": [...] },
    "risks": [...]
  },
  "meta": { ... }
}
```

## 硬约束

1. `data_quality.is_degraded=true` → action 不得为 ALLOW
2. `policy_decision.allow_new_trades=false` → action 不得为 ALLOW
3. triggers 必须包含环境因子 + 至少 4 个票面因子

## 错误处理

当工具调用失败时，返回：
```json
{
  "type": "Error",
  "error": {
    "code": "INVALID_INPUT|TIMEOUT|MODEL_ERROR|INTERNAL",
    "message": "...",
    "retryable": true
  },
  "meta": { ... }
}
```

主 App 处理策略：
- 可重试：最多 1-2 次
- 不可重试：降级为默认输出 + warnings
