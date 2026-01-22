import type { InputBundle, AgentEnvelope, MarketMode, RiskLight } from "../types.js";

interface MarketStatePayload {
  mode: MarketMode;
  riskLight: RiskLight;
  reasons: Array<{ key: string; value: number | string; rule: string }>;
  suggestedRisk: {
    allowNewTrades: boolean;
    maxTotalPosition: number;
    maxSinglePosition: number;
  };
}

/**
 * market_state 工具
 * 解释市场状态并给出仓控建议
 */
export async function marketState(
  inputBundle: InputBundle
): Promise<AgentEnvelope<MarketStatePayload>> {
  const { market, strategyContext } = inputBundle;
  const reasons: Array<{ key: string; value: number | string; rule: string }> = [];

  // 判断市场模式
  let mode: MarketMode = "DIVERGENCE";
  if (market.riskLight === "GREEN" && market.bombRate <= 0.2 && market.limitUpCount >= 50) {
    mode = "STRONG";
  } else if (market.riskLight === "RED" || market.bombRate > 0.4) {
    mode = "WEAK";
  } else if (market.bombRate > 0.35 && market.limitDownCount > 30) {
    mode = "CHAOS";
  }

  // 生成原因
  reasons.push({
    key: "bomb_rate",
    value: market.bombRate,
    rule: market.bombRate <= 0.3 ? "<=0.30 => 正常" : ">0.30 => 警告",
  });
  reasons.push({
    key: "limit_up_count",
    value: market.limitUpCount,
    rule: market.limitUpCount >= 50 ? ">=50 => 活跃" : "<50 => 冷淡",
  });
  reasons.push({
    key: "risk_light",
    value: market.riskLight,
    rule: `当前${market.riskLight}灯`,
  });

  // 计算仓控建议
  let allowNewTrades = true;
  let maxTotalPosition = 0.8;
  let maxSinglePosition = 0.15;

  if (market.riskLight === "RED") {
    allowNewTrades = false;
    reasons.push({ key: "policy", value: "RED", rule: "红灯禁止新增" });
  }

  if (strategyContext.dataQuality.isDegraded) {
    allowNewTrades = false;
    reasons.push({ key: "data_quality", value: "degraded", rule: "数据降级禁止新增" });
  }

  if (market.riskLight === "YELLOW") {
    maxTotalPosition = 0.6;
    maxSinglePosition = 0.1;
    reasons.push({ key: "policy", value: "YELLOW", rule: "黄灯折减仓位" });
  }

  if (market.bombRate > 0.3) {
    maxTotalPosition = Math.min(maxTotalPosition, 0.5);
    maxSinglePosition = Math.min(maxSinglePosition, 0.08);
  }

  return {
    type: "MarketState",
    payload: {
      mode,
      riskLight: market.riskLight,
      reasons,
      suggestedRisk: {
        allowNewTrades,
        maxTotalPosition,
        maxSinglePosition,
      },
    },
    meta: {
      agent: "market_state",
      version: "0.2.0",
      ts: new Date().toISOString(),
      confidence: 0.85,
      warnings: [],
    },
  };
}
