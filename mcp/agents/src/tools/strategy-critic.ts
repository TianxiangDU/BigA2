import type { AgentEnvelope } from "../types.js";

interface StrategyDSL {
  strategyId: string;
  name: string;
  version: string;
  triggers?: unknown[];
  scoring?: unknown;
  execution?: unknown;
}

interface StatsSummary {
  trades: number;
  winRate: number;
  avgReturn: number;
  maxDrawdown: number;
}

interface StrategyCriticInput {
  strategyDsl: StrategyDSL;
  statsSummary?: StatsSummary;
}

interface RiskPoint {
  type: "overfitting" | "contradiction" | "missing_feature" | "unexplainable" | "other";
  description: string;
  severity: "low" | "medium" | "high";
}

interface ParamSuggestion {
  param: string;
  currentValue: unknown;
  suggestedValue: unknown;
  reason: string;
}

interface StrategyCriticPayload {
  strategyId: string;
  riskPoints: RiskPoint[];
  paramSuggestions: ParamSuggestion[];
  suggestedRegimes: string[];
  testCaseSuggestions: string[];
  summary: string;
}

/**
 * strategy_critic 工具
 * 评估策略卡的风险点和调参建议
 */
export async function strategyCritic(
  input: StrategyCriticInput
): Promise<AgentEnvelope<StrategyCriticPayload>> {
  const { strategyDsl, statsSummary } = input;
  const riskPoints: RiskPoint[] = [];
  const paramSuggestions: ParamSuggestion[] = [];
  const suggestedRegimes: string[] = [];
  const testCaseSuggestions: string[] = [];

  // 基于统计数据分析
  if (statsSummary) {
    // 低胜率警告
    if (statsSummary.winRate < 0.5) {
      riskPoints.push({
        type: "other",
        description: `胜率低于50%（当前${(statsSummary.winRate * 100).toFixed(1)}%），需要重新评估策略逻辑`,
        severity: "high",
      });
      paramSuggestions.push({
        param: "min_score",
        currentValue: 60,
        suggestedValue: 70,
        reason: "提高入场门槛以过滤低质量信号",
      });
    }

    // 高回撤警告
    if (statsSummary.maxDrawdown < -0.1) {
      riskPoints.push({
        type: "other",
        description: `最大回撤过大（${(statsSummary.maxDrawdown * 100).toFixed(1)}%），风险控制不足`,
        severity: "high",
      });
      paramSuggestions.push({
        param: "max_single_position",
        currentValue: 0.1,
        suggestedValue: 0.06,
        reason: "降低单票仓位以控制回撤",
      });
    }

    // 样本量不足
    if (statsSummary.trades < 20) {
      riskPoints.push({
        type: "overfitting",
        description: `交易样本量不足（${statsSummary.trades}次），统计意义有限`,
        severity: "medium",
      });
      testCaseSuggestions.push("增加更多历史回测场景");
    }
  }

  // 策略 DSL 分析
  if (!strategyDsl.triggers || (strategyDsl.triggers as unknown[]).length < 3) {
    riskPoints.push({
      type: "unexplainable",
      description: "触发条件过少，策略可解释性不足",
      severity: "medium",
    });
    testCaseSuggestions.push("补充更多触发条件以提高可解释性");
  }

  // 建议适用市场状态
  suggestedRegimes.push("STRONG", "DIVERGENCE");
  if (statsSummary && statsSummary.winRate >= 0.6) {
    suggestedRegimes.push("WEAK");
  }

  // 生成测试建议
  testCaseSuggestions.push(
    "测试 RED 灯环境下是否正确拦截",
    "测试数据降级时是否禁止 ALLOW",
    "测试连续亏损后仓位是否自动降低"
  );

  const summary =
    riskPoints.length === 0
      ? "策略整体健康，建议持续观察"
      : `发现 ${riskPoints.length} 个风险点，建议关注并调整参数`;

  return {
    type: "StrategyCritic",
    payload: {
      strategyId: strategyDsl.strategyId,
      riskPoints,
      paramSuggestions,
      suggestedRegimes,
      testCaseSuggestions,
      summary,
    },
    meta: {
      agent: "strategy_critic",
      version: "0.2.0",
      ts: new Date().toISOString(),
    },
  };
}
