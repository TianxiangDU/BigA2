import type { AgentEnvelope, Outcome, ResultLabel } from "../types.js";

interface RootCause {
  factor: string;
  detail: string;
}

interface ReviewAnalyzeInput {
  alertId: string;
  snapshot: unknown;
  signalCard: unknown;
  outcome: Outcome;
}

interface ReviewAnalyzePayload {
  alertId: string;
  label: ResultLabel;
  rootCauses: RootCause[];
  suggestions: string[];
  summary: string;
}

/**
 * review_analyze 工具
 * 复盘归因并给出参数调整建议
 */
export async function reviewAnalyze(
  input: ReviewAnalyzeInput
): Promise<AgentEnvelope<ReviewAnalyzePayload>> {
  const { alertId, outcome } = input;
  const rootCauses: RootCause[] = [];
  const suggestions: string[] = [];
  let summary = "";

  // 根据结果标签生成归因
  if (outcome.label === "SUCCESS") {
    rootCauses.push({
      factor: "策略有效",
      detail: "触发条件判断准确，市场配合",
    });
    suggestions.push("当前参数有效，继续观察");
    summary = "策略判断准确，执行成功";
  } else if (outcome.label === "FAIL") {
    // 失败归因
    rootCauses.push({
      factor: "市场环境变化",
      detail: "入场后市场情绪恶化或题材分歧扩大",
    });

    if (outcome.pnl && outcome.pnl < -0.03) {
      rootCauses.push({
        factor: "止损不及时",
        detail: "亏损超过3%，可能未及时执行退出规则",
      });
      suggestions.push("严格执行开板30s不回封=>减仓规则");
    }

    if (outcome.notes?.includes("炸板")) {
      rootCauses.push({
        factor: "炸板风险",
        detail: "入场后遭遇炸板",
      });
      suggestions.push("考虑收紧回封速度阈值，从60s到45s");
    }

    suggestions.push("YELLOW灯且炸板率>30%时，将max_single_position下调到0.06");
    suggestions.push("分歧日优先观望，减少操作频率");

    summary = "市场环境变化导致失败，建议收紧参数阈值";
  } else {
    // SKIP
    rootCauses.push({
      factor: "观望信号",
      detail: "策略给出观望建议，未执行操作",
    });
    suggestions.push("观望策略正确，继续保持纪律");
    summary = "观望信号，未执行操作";
  }

  return {
    type: "ReviewAnalyst",
    payload: {
      alertId,
      label: outcome.label,
      rootCauses,
      suggestions,
      summary,
    },
    meta: {
      agent: "review_analyze",
      version: "0.2.0",
      ts: new Date().toISOString(),
    },
  };
}
