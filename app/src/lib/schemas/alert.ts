import { z } from "zod";
import { ActionSchema, TriggerSchema, PlanSchema, PositionHintSchema } from "./strategy";

// Signal Card - 提示卡
export const SignalCardSchema = z.object({
  alertId: z.string(),
  symbol: z.string(),
  strategyGroupId: z.string(),
  action: ActionSchema,
  oneLiner: z.string().max(200),
  triggers: z.array(TriggerSchema),
  plan: z.object({
    maxSinglePosition: z.number().min(0).max(1),
    entryNote: z.string(),
    exitRules: z.array(z.string()).min(3),
  }),
  risks: z.array(z.string()),
  snapshotHint: z.object({
    shouldCreateSnapshot: z.boolean(),
    snapshotTags: z.array(z.string()),
  }).optional(),
  snapshotId: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type SignalCard = z.infer<typeof SignalCardSchema>;

// Signal Explain Input - 信号解释工具的输入
export const SignalExplainInputSchema = z.object({
  symbol: z.string(),
  inputBundle: z.unknown(), // InputBundle
  aggregatedItem: z.object({
    score: z.number(),
    action: ActionSchema,
    confidence: z.number(),
    tags: z.array(z.string()),
    triggers: z.array(TriggerSchema),
    planHint: PositionHintSchema.optional(),
  }),
  policyDecision: z.object({
    allowNewTrades: z.boolean(),
    maxTotalPosition: z.number(),
    maxSinglePosition: z.number(),
    reason: z.string(),
  }),
});
export type SignalExplainInput = z.infer<typeof SignalExplainInputSchema>;

// Signal Explain Result - 信号解释工具的输出
export const SignalExplainResultSchema = z.object({
  symbol: z.string(),
  strategyGroupId: z.string(),
  action: ActionSchema,
  oneLiner: z.string().max(200),
  triggers: z.array(TriggerSchema),
  plan: z.object({
    maxSinglePosition: z.number(),
    entryNote: z.string(),
    exitRules: z.array(z.string()).min(3),
  }),
  risks: z.array(z.string()),
  snapshotHint: z.object({
    shouldCreateSnapshot: z.boolean(),
    snapshotTags: z.array(z.string()),
  }),
});
export type SignalExplainResult = z.infer<typeof SignalExplainResultSchema>;
