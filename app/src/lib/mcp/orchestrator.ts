import { mcpClient } from "./client";
import { strategyRegistry } from "./registry";
import { StrategyConfig, StrategyGroupConfig, MCPToolResult } from "./types";
import {
  InputBundle,
  StrategyResult,
  AggregatedResult,
  AggregatedItem,
  PolicyDecision,
  Action,
  Recommendation,
} from "../schemas";

/**
 * Strategy Orchestrator - 策略编排器
 * 
 * 负责：
 * 1. 并行调用多个策略
 * 2. 聚合策略结果
 * 3. 处理策略失败/超时
 */
class Orchestrator {
  /**
   * 运行策略组
   */
  async runStrategyGroup(
    groupId: string,
    inputBundle: InputBundle
  ): Promise<AggregatedResult> {
    const group = strategyRegistry.getGroup(groupId);
    if (!group) {
      throw new Error(`Strategy group not found: ${groupId}`);
    }

    const enabledStrategies = group.strategies.filter((s) => s.enabled);
    if (enabledStrategies.length === 0) {
      throw new Error(`No enabled strategies in group: ${groupId}`);
    }

    // 并行调用所有策略
    const strategyResults = await this.runStrategiesParallel(
      enabledStrategies,
      inputBundle
    );

    // 聚合结果
    const aggregatedItems = this.aggregateRecommendations(
      strategyResults,
      group
    );

    // 应用 Policy Gate
    const policyDecision = this.applyPolicyGate(inputBundle, aggregatedItems);

    // 根据 Policy Gate 结果调整 action
    const finalItems = this.applyPolicyToItems(aggregatedItems, policyDecision);

    return {
      groupId,
      ts: new Date().toISOString(),
      recommendations: finalItems,
      policyDecision,
      perStrategyResults: strategyResults.filter(
        (r) => r !== null
      ) as StrategyResult[],
      warnings: this.collectWarnings(strategyResults),
    };
  }

  /**
   * 并行运行多个策略
   */
  private async runStrategiesParallel(
    strategies: StrategyConfig[],
    inputBundle: InputBundle
  ): Promise<(StrategyResult | null)[]> {
    const calls = strategies.map((strategy) => ({
      server: strategy.server,
      tool: strategy.tool,
      args: {
        strategy_id: strategy.strategyId,
        input_bundle: inputBundle,
        params: strategy.params,
      },
      timeoutMs: strategy.timeoutMs,
    }));

    const results = await mcpClient.callToolsParallel<StrategyResult>(calls);

    return results.map((result, index) => {
      if (result.success && result.data) {
        return this.normalizeStrategyResult(result.data, strategies[index]);
      }
      console.warn(
        `Strategy ${strategies[index].strategyId} failed:`,
        result.error
      );
      return null;
    });
  }

  /**
   * 规范化策略结果（处理字段命名差异）
   */
  private normalizeStrategyResult(
    data: unknown,
    strategy: StrategyConfig
  ): StrategyResult {
    const raw = data as Record<string, unknown>;
    return {
      strategyId: (raw.strategy_id as string) || strategy.strategyId,
      version: (raw.version as string) || strategy.version,
      ts: (raw.ts as string) || new Date().toISOString(),
      recommendations: this.normalizeRecommendations(
        raw.recommendations as unknown[]
      ),
      warnings: (raw.warnings as string[]) || [],
      meta: {
        paramsUsed: (raw.meta as Record<string, unknown>)?.params_used as Record<string, unknown> || {},
        runtimeMs: (raw.meta as Record<string, unknown>)?.runtime_ms as number || 0,
      },
    };
  }

  private normalizeRecommendations(recs: unknown[]): Recommendation[] {
    if (!Array.isArray(recs)) return [];
    return recs.map((r) => {
      const rec = r as Record<string, unknown>;
      return {
        symbol: rec.symbol as string,
        name: rec.name as string,
        action: rec.action as Action,
        score: rec.score as number,
        confidence: rec.confidence as number,
        tags: (rec.tags as string[]) || [],
        positionHint: {
          maxSinglePosition:
            (rec.position_hint as Record<string, number>)?.max_single_position || 0.1,
        },
        triggers: ((rec.triggers as unknown[]) || []).map((t) => {
          const trigger = t as Record<string, string>;
          return {
            name: trigger.name,
            status: trigger.status as "PASS" | "FAIL" | "MISSING",
            detail: trigger.detail,
          };
        }),
        plan: rec.plan
          ? {
              entryNote: (rec.plan as Record<string, unknown>).entry_note as string || "",
              exitRules: (rec.plan as Record<string, unknown>).exit_rules as string[] || [],
            }
          : undefined,
        risks: (rec.risks as string[]) || [],
      };
    });
  }

  /**
   * 聚合多个策略的推荐结果
   */
  private aggregateRecommendations(
    results: (StrategyResult | null)[],
    group: StrategyGroupConfig
  ): AggregatedItem[] {
    const validResults = results.filter((r) => r !== null) as StrategyResult[];
    const symbolMap = new Map<string, AggregatedItem>();

    // 收集所有推荐，按 symbol 分组
    for (const result of validResults) {
      const strategy = group.strategies.find(
        (s) => s.strategyId === result.strategyId
      );
      const weight = strategy?.weight || 1;

      for (const rec of result.recommendations) {
        const existing = symbolMap.get(rec.symbol);

        if (existing) {
          // 合并到已有项
          existing.score = existing.score + rec.score * weight;
          existing.confidence = Math.max(existing.confidence, rec.confidence);
          existing.tags = [...new Set([...existing.tags, ...rec.tags])];
          existing.triggers = [...existing.triggers, ...rec.triggers];
          existing.contributingStrategies.push(result.strategyId);

          // 处理 action 冲突
          existing.action = this.resolveActionConflict(
            existing.action,
            rec.action,
            group.conflictRule
          );
        } else {
          // 新增项
          symbolMap.set(rec.symbol, {
            symbol: rec.symbol,
            name: rec.name,
            action: rec.action,
            score: rec.score * weight,
            confidence: rec.confidence,
            tags: [...rec.tags],
            triggers: [...rec.triggers],
            planHint: rec.positionHint,
            contributingStrategies: [result.strategyId],
          });
        }
      }
    }

    // 归一化分数
    const items = Array.from(symbolMap.values());
    const totalWeight = group.strategies
      .filter((s) => s.enabled)
      .reduce((sum, s) => sum + s.weight, 0);

    for (const item of items) {
      const contributingWeight = item.contributingStrategies.reduce(
        (sum, id) => {
          const s = group.strategies.find((s) => s.strategyId === id);
          return sum + (s?.weight || 0);
        },
        0
      );
      item.score = (item.score / contributingWeight) * totalWeight;
    }

    // 按分数排序
    return items.sort((a, b) => b.score - a.score);
  }

  /**
   * 解决 action 冲突
   */
  private resolveActionConflict(
    existing: Action,
    incoming: Action,
    rule: "block_wins" | "allow_wins"
  ): Action {
    if (rule === "block_wins") {
      // 任一 BLOCK => BLOCK
      if (existing === "BLOCK" || incoming === "BLOCK") return "BLOCK";
      // 任一 WATCH => WATCH
      if (existing === "WATCH" || incoming === "WATCH") return "WATCH";
      return "ALLOW";
    } else {
      // 任一 ALLOW => ALLOW
      if (existing === "ALLOW" || incoming === "ALLOW") return "ALLOW";
      if (existing === "WATCH" || incoming === "WATCH") return "WATCH";
      return "BLOCK";
    }
  }

  /**
   * 应用 Policy Gate
   */
  private applyPolicyGate(
    inputBundle: InputBundle,
    items: AggregatedItem[]
  ): PolicyDecision {
    const { market, strategyContext, portfolio } = inputBundle;
    const reasons: string[] = [];

    let allowNewTrades = true;
    let maxTotalPosition = 0.8;
    let maxSinglePosition = 0.15;

    // 规则1: 红灯禁止新增
    if (market.riskLight === "RED") {
      allowNewTrades = false;
      reasons.push("RED灯禁止新增");
    }

    // 规则2: 数据降级禁止 ALLOW
    if (strategyContext.dataQuality.isDegraded) {
      allowNewTrades = false;
      reasons.push("数据降级禁止新增");
    }

    // 规则3: 黄灯折减仓位
    if (market.riskLight === "YELLOW") {
      maxTotalPosition = Math.min(maxTotalPosition, 0.6);
      maxSinglePosition = Math.min(maxSinglePosition, 0.1);
      reasons.push("YELLOW灯折减仓位");
    }

    // 规则4: 高炸板率降低仓位
    if (market.bombRate > 0.3) {
      maxTotalPosition = Math.min(maxTotalPosition, 0.5);
      maxSinglePosition = Math.min(maxSinglePosition, 0.08);
      reasons.push("炸板率>30%降低仓位");
    }

    // 规则5: 连亏降低仓位
    const consecutiveLosses = portfolio?.consecutiveLosses || 0;
    if (consecutiveLosses >= 2) {
      maxSinglePosition = Math.min(maxSinglePosition, 0.06);
      reasons.push(`连亏${consecutiveLosses}次降低单票仓位`);
    }

    // 规则6: 低置信度项目禁止 ALLOW
    const lowConfidenceItems = items.filter((item) => item.confidence < 0.6);
    if (lowConfidenceItems.length > 0) {
      reasons.push("部分项目置信度<0.6");
    }

    return {
      allowNewTrades,
      maxTotalPosition,
      maxSinglePosition,
      reason: reasons.join("; ") || "正常",
    };
  }

  /**
   * 根据 Policy Gate 调整推荐项的 action
   */
  private applyPolicyToItems(
    items: AggregatedItem[],
    policy: PolicyDecision
  ): AggregatedItem[] {
    return items.map((item) => {
      let action = item.action;

      // 如果不允许新交易，将 ALLOW 降级为 WATCH
      if (!policy.allowNewTrades && action === "ALLOW") {
        action = "WATCH";
      }

      // 低置信度降级
      if (item.confidence < 0.6 && action === "ALLOW") {
        action = "WATCH";
      }

      return {
        ...item,
        action,
        planHint: {
          maxSinglePosition: Math.min(
            item.planHint?.maxSinglePosition || policy.maxSinglePosition,
            policy.maxSinglePosition
          ),
        },
      };
    });
  }

  /**
   * 收集所有警告
   */
  private collectWarnings(results: (StrategyResult | null)[]): string[] {
    const warnings: string[] = [];

    // 收集失败的策略
    const failedCount = results.filter((r) => r === null).length;
    if (failedCount > 0) {
      warnings.push(`${failedCount} 个策略执行失败`);
    }

    // 收集策略级别的警告
    for (const result of results) {
      if (result?.warnings) {
        warnings.push(...result.warnings);
      }
    }

    return warnings;
  }
}

// Singleton instance
export const orchestrator = new Orchestrator();
