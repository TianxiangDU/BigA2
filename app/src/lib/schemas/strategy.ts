import { z } from "zod";

// Action
export const ActionSchema = z.enum(["ALLOW", "WATCH", "BLOCK"]);
export type Action = z.infer<typeof ActionSchema>;

// Trigger Status
export const TriggerStatusSchema = z.enum(["PASS", "FAIL", "MISSING"]);
export type TriggerStatus = z.infer<typeof TriggerStatusSchema>;

// Trigger
export const TriggerSchema = z.object({
  name: z.string(),
  status: TriggerStatusSchema,
  detail: z.string(),
});
export type Trigger = z.infer<typeof TriggerSchema>;

// Position Hint
export const PositionHintSchema = z.object({
  maxSinglePosition: z.number().min(0).max(1),
});
export type PositionHint = z.infer<typeof PositionHintSchema>;

// Plan
export const PlanSchema = z.object({
  entryNote: z.string(),
  exitRules: z.array(z.string()).min(3),
});
export type Plan = z.infer<typeof PlanSchema>;

// Recommendation (单个推荐项)
export const RecommendationSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  action: ActionSchema,
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()),
  positionHint: PositionHintSchema,
  triggers: z.array(TriggerSchema),
  plan: PlanSchema.optional(),
  risks: z.array(z.string()),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

// Strategy Meta
export const StrategyMetaSchema = z.object({
  paramsUsed: z.record(z.string(), z.unknown()),
  runtimeMs: z.number().int(),
});
export type StrategyMeta = z.infer<typeof StrategyMetaSchema>;

// Strategy Result - 单个策略的输出
export const StrategyResultSchema = z.object({
  strategyId: z.string(),
  version: z.string(),
  ts: z.string().datetime(),
  recommendations: z.array(RecommendationSchema),
  warnings: z.array(z.string()),
  meta: StrategyMetaSchema,
});
export type StrategyResult = z.infer<typeof StrategyResultSchema>;

// Aggregated Item - 聚合后的单个推荐
export const AggregatedItemSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  action: ActionSchema,
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()),
  triggers: z.array(TriggerSchema),
  planHint: PositionHintSchema.optional(),
  contributingStrategies: z.array(z.string()),
});
export type AggregatedItem = z.infer<typeof AggregatedItemSchema>;

// Policy Decision - Policy Gate 的裁决结果
export const PolicyDecisionSchema = z.object({
  allowNewTrades: z.boolean(),
  maxTotalPosition: z.number().min(0).max(1),
  maxSinglePosition: z.number().min(0).max(1),
  reason: z.string(),
});
export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;

// Aggregated Result - 策略组聚合后的输出
export const AggregatedResultSchema = z.object({
  groupId: z.string(),
  ts: z.string().datetime(),
  recommendations: z.array(AggregatedItemSchema),
  policyDecision: PolicyDecisionSchema,
  perStrategyResults: z.array(StrategyResultSchema),
  warnings: z.array(z.string()),
});
export type AggregatedResult = z.infer<typeof AggregatedResultSchema>;

// Strategy Registry Item
export const StrategyRegistryItemSchema = z.object({
  strategyId: z.string(),
  name: z.string(),
  version: z.string(),
  server: z.string(),
  tool: z.string(),
  enabled: z.boolean(),
  weight: z.number().min(0).max(1),
  timeoutMs: z.number().int().positive(),
  params: z.record(z.string(), z.unknown()),
});
export type StrategyRegistryItem = z.infer<typeof StrategyRegistryItemSchema>;

// Strategy Group
export const StrategyGroupSchema = z.object({
  groupId: z.string(),
  name: z.string(),
  strategies: z.array(StrategyRegistryItemSchema),
  aggregationMethod: z.enum(["weighted", "voting", "filter"]),
  conflictRule: z.enum(["block_wins", "allow_wins"]),
});
export type StrategyGroup = z.infer<typeof StrategyGroupSchema>;
