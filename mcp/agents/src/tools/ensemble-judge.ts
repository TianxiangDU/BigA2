import type { AgentEnvelope, Action, MarketState, PolicyDecision } from "../types.js";

interface PerStrategyItem {
  strategyId: string;
  action: Action;
  score: number;
  confidence: number;
  triggers: Array<{ name: string; status: string; detail: string }>;
}

interface EnsembleJudgeInput {
  symbol: string;
  perStrategyItems: PerStrategyItem[];
  marketState: MarketState;
  policyDecision: PolicyDecision;
}

interface ConflictExplanation {
  strategyA: string;
  strategyB: string;
  conflictType: "action_mismatch" | "score_divergence" | "confidence_gap";
  explanation: string;
}

interface EnsembleJudgePayload {
  symbol: string;
  recommendedAction: Action;
  actionExplanation: string;
  conflicts: ConflictExplanation[];
  suggestedPosition: number;
  confidence: number;
}

/**
 * ensemble_judge 工具
 * 对多策略输出进行仲裁和解释
 */
export async function ensembleJudge(
  input: EnsembleJudgeInput
): Promise<AgentEnvelope<EnsembleJudgePayload>> {
  const { symbol, perStrategyItems, marketState, policyDecision } = input;
  const conflicts: ConflictExplanation[] = [];

  // 检测冲突
  for (let i = 0; i < perStrategyItems.length; i++) {
    for (let j = i + 1; j < perStrategyItems.length; j++) {
      const a = perStrategyItems[i];
      const b = perStrategyItems[j];

      // Action 冲突
      if (a.action !== b.action) {
        conflicts.push({
          strategyA: a.strategyId,
          strategyB: b.strategyId,
          conflictType: "action_mismatch",
          explanation: `${a.strategyId} 建议 ${a.action}，${b.strategyId} 建议 ${b.action}`,
        });
      }

      // 分数差异过大
      if (Math.abs(a.score - b.score) > 20) {
        conflicts.push({
          strategyA: a.strategyId,
          strategyB: b.strategyId,
          conflictType: "score_divergence",
          explanation: `分数差异大：${a.strategyId}(${a.score.toFixed(1)}) vs ${b.strategyId}(${b.score.toFixed(1)})`,
        });
      }
    }
  }

  // 确定推荐 action
  let recommendedAction: Action = "WATCH";
  const hasBlock = perStrategyItems.some((item) => item.action === "BLOCK");
  const hasAllow = perStrategyItems.some((item) => item.action === "ALLOW");

  if (hasBlock) {
    recommendedAction = "BLOCK";
  } else if (hasAllow && policyDecision.allowNewTrades) {
    recommendedAction = "ALLOW";
  }

  // 根据 Policy Gate 调整
  if (!policyDecision.allowNewTrades && recommendedAction === "ALLOW") {
    recommendedAction = "WATCH";
  }

  // 计算综合置信度
  const avgConfidence =
    perStrategyItems.reduce((sum, item) => sum + item.confidence, 0) /
    perStrategyItems.length;

  // 生成解释
  let actionExplanation = "";
  if (recommendedAction === "BLOCK") {
    actionExplanation = "存在策略明确阻止，建议不操作";
  } else if (recommendedAction === "ALLOW") {
    if (conflicts.length > 0) {
      actionExplanation = `多策略存在分歧，但综合评估可操作，注意控制仓位`;
    } else {
      actionExplanation = "多策略一致看好，可操作";
    }
  } else {
    actionExplanation = "综合评估建议观望，等待更明确信号";
  }

  // 如果市场状态不佳，追加说明
  if (marketState.riskLight === "YELLOW") {
    actionExplanation += "；黄灯市场需谨慎";
  }

  // 计算建议仓位
  let suggestedPosition = policyDecision.maxSinglePosition;
  if (conflicts.length > 0) {
    suggestedPosition = Math.min(suggestedPosition * 0.7, 0.08);
  }

  return {
    type: "EnsembleJudge",
    payload: {
      symbol,
      recommendedAction,
      actionExplanation,
      conflicts,
      suggestedPosition,
      confidence: avgConfidence,
    },
    meta: {
      agent: "ensemble_judge",
      version: "0.2.0",
      ts: new Date().toISOString(),
      confidence: avgConfidence,
    },
  };
}
