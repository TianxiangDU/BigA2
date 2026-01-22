import type { InputBundle, AgentEnvelope } from "../types.js";

interface RiskCoachPayload {
  allowNewTrades: boolean;
  maxTotalPosition: number;
  maxSinglePosition: number;
  notes: string[];
}

/**
 * risk_coach 工具
 * 提供更保守的风控建议
 */
export async function riskCoach(
  inputBundle: InputBundle
): Promise<AgentEnvelope<RiskCoachPayload>> {
  const { market, portfolio, strategyContext } = inputBundle;
  const notes: string[] = [];

  let allowNewTrades = true;
  let maxTotalPosition = 0.8;
  let maxSinglePosition = 0.15;

  // 规则1: 红灯禁止
  if (market.riskLight === "RED") {
    allowNewTrades = false;
    notes.push("RED灯，禁止新增");
  }

  // 规则2: 数据降级禁止
  if (strategyContext.dataQuality.isDegraded) {
    allowNewTrades = false;
    notes.push("数据降级，禁止新增");
  }

  // 规则3: 黄灯折减
  if (market.riskLight === "YELLOW") {
    maxTotalPosition = Math.min(maxTotalPosition, 0.6);
    maxSinglePosition = Math.min(maxSinglePosition, 0.1);
    notes.push("YELLOW灯，折减仓位");
  }

  // 规则4: 高炸板率
  if (market.bombRate > 0.3) {
    maxTotalPosition = Math.min(maxTotalPosition, 0.5);
    maxSinglePosition = Math.min(maxSinglePosition, 0.08);
    notes.push(`炸板率${(market.bombRate * 100).toFixed(0)}%，降低仓位`);
  }

  // 规则5: 连亏
  const consecutiveLosses = portfolio?.consecutiveLosses || 0;
  if (consecutiveLosses >= 2) {
    maxSinglePosition = Math.min(maxSinglePosition, 0.06);
    notes.push(`连亏${consecutiveLosses}次，降低单票仓位`);
  }
  if (consecutiveLosses >= 3) {
    maxTotalPosition = Math.min(maxTotalPosition, 0.4);
    notes.push("连亏3次以上，大幅降低总仓位");
  }

  // 规则6: 已有持仓较重
  if (portfolio) {
    const currentPosition = 1 - portfolio.cash / portfolio.totalValue;
    if (currentPosition > 0.6) {
      maxTotalPosition = Math.min(maxTotalPosition, currentPosition + 0.1);
      notes.push("已有持仓较重，限制新增");
    }
  }

  // 如果没有特别提示，添加正常状态
  if (notes.length === 0) {
    notes.push("风控状态正常");
  }

  return {
    type: "RiskCoach",
    payload: {
      allowNewTrades,
      maxTotalPosition,
      maxSinglePosition,
      notes,
    },
    meta: {
      agent: "risk_coach",
      version: "0.2.0",
      ts: new Date().toISOString(),
    },
  };
}
