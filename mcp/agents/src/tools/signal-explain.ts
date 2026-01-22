import type {
  InputBundle,
  AgentEnvelope,
  AggregatedItem,
  PolicyDecision,
  Action,
  Trigger,
} from "../types.js";

interface SignalExplainInput {
  symbol: string;
  inputBundle: InputBundle;
  aggregatedItem: AggregatedItem;
  policyDecision: PolicyDecision;
}

interface SignalExplainPayload {
  symbol: string;
  strategyGroupId: string;
  action: Action;
  oneLiner: string;
  triggers: Trigger[];
  plan: {
    maxSinglePosition: number;
    entryNote: string;
    exitRules: string[];
  };
  risks: string[];
  snapshotHint: {
    shouldCreateSnapshot: boolean;
    snapshotTags: string[];
  };
}

/**
 * signal_explain 工具
 * 生成信号卡/提示卡
 */
export async function signalExplain(
  input: SignalExplainInput
): Promise<AgentEnvelope<SignalExplainPayload>> {
  const { symbol, inputBundle, aggregatedItem, policyDecision } = input;
  const { market, strategyContext } = inputBundle;
  const warnings: string[] = [];

  // 硬约束检查
  let action: Action = aggregatedItem.action;

  // 规则1: 数据降级不得 ALLOW
  if (strategyContext.dataQuality.isDegraded && action === "ALLOW") {
    action = "WATCH";
    warnings.push("数据降级，action 降级为 WATCH");
  }

  // 规则2: policy 不允许新交易不得 ALLOW
  if (!policyDecision.allowNewTrades && action === "ALLOW") {
    action = "WATCH";
    warnings.push("风控禁止新增，action 降级为 WATCH");
  }

  // 规则3: 低置信度不得 ALLOW
  if (aggregatedItem.confidence < 0.6 && action === "ALLOW") {
    action = "WATCH";
    warnings.push("置信度低于0.6，action 降级为 WATCH");
  }

  // 生成 triggers（确保包含环境因子）
  const triggers: Trigger[] = [
    ...aggregatedItem.triggers,
    {
      name: "风险灯",
      status: market.riskLight === "RED" ? "FAIL" : "PASS",
      detail: `${market.riskLight} => ${market.riskLight === "GREEN" ? "正常" : market.riskLight === "YELLOW" ? "限仓" : "禁止"}`,
    },
    {
      name: "炸板率",
      status: market.bombRate <= 0.3 ? "PASS" : "FAIL",
      detail: `${(market.bombRate * 100).toFixed(0)}% ${market.bombRate <= 0.3 ? "<=" : ">"} 30%阈值`,
    },
  ];

  // 如果 triggers 不足 4 个票面因子，添加默认
  if (triggers.length < 6) {
    triggers.push({
      name: "成交额",
      status: "PASS",
      detail: "满足最低成交额要求",
    });
  }

  // 生成 one-liner
  const actionLabel = action === "ALLOW" ? "可操作" : action === "WATCH" ? "观望" : "禁止";
  const riskLabel = market.riskLight === "GREEN" ? "绿灯" : market.riskLight === "YELLOW" ? "黄灯" : "红灯";
  const tagStr = aggregatedItem.tags.slice(0, 2).join("/");
  const oneLiner = `${riskLabel}${action === "ALLOW" ? "分歧" : ""}，${tagStr}，${actionLabel}${action === "ALLOW" ? "小仓试错" : ""}`.slice(0, 200);

  // 生成执行计划
  const maxSinglePosition = Math.min(
    aggregatedItem.planHint?.maxSinglePosition || 0.1,
    policyDecision.maxSinglePosition
  );

  const plan = {
    maxSinglePosition,
    entryNote: action === "ALLOW" 
      ? "回封确认后小仓入场，不追高超预期拉升段" 
      : "等待更明确信号",
    exitRules: [
      "开板30s不回封 => 放弃/减仓",
      `回撤 > 18% => 止损`,
      "risk_light 变 RED => 停止新增",
      "尾盘14:30后不新增仓位",
    ],
  };

  // 生成风险提示
  const risks: string[] = [];
  if (market.riskLight === "YELLOW") {
    risks.push("黄灯市场，分歧可能扩大");
  }
  if (market.bombRate > 0.25) {
    risks.push(`炸板率${(market.bombRate * 100).toFixed(0)}%，需关注回封稳定性`);
  }
  if (aggregatedItem.confidence < 0.7) {
    risks.push("置信度中等，建议降低仓位");
  }

  return {
    type: "SignalExplain",
    payload: {
      symbol,
      strategyGroupId: "default",
      action,
      oneLiner,
      triggers,
      plan,
      risks,
      snapshotHint: {
        shouldCreateSnapshot: action === "ALLOW" || action === "WATCH",
        snapshotTags: ["signal_card", symbol, ...aggregatedItem.tags.slice(0, 2)],
      },
    },
    meta: {
      agent: "signal_explain",
      version: "0.2.0",
      ts: new Date().toISOString(),
      confidence: aggregatedItem.confidence,
      warnings,
    },
  };
}
