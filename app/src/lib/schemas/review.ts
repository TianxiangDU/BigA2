import { z } from "zod";
import { ActionSchema } from "./strategy";

// Result Label
export const ResultLabelSchema = z.enum(["SUCCESS", "FAIL", "SKIP"]);
export type ResultLabel = z.infer<typeof ResultLabelSchema>;

// Outcome
export const OutcomeSchema = z.object({
  label: ResultLabelSchema,
  pnl: z.number().optional(),
  notes: z.string().optional(),
});
export type Outcome = z.infer<typeof OutcomeSchema>;

// Root Cause
export const RootCauseSchema = z.object({
  factor: z.string(),
  detail: z.string(),
});
export type RootCause = z.infer<typeof RootCauseSchema>;

// Review Analyze Input
export const ReviewAnalyzeInputSchema = z.object({
  alertId: z.string(),
  snapshot: z.unknown(),
  signalCard: z.unknown(),
  outcome: OutcomeSchema,
});
export type ReviewAnalyzeInput = z.infer<typeof ReviewAnalyzeInputSchema>;

// Review Analyze Result
export const ReviewAnalyzeResultSchema = z.object({
  alertId: z.string(),
  label: ResultLabelSchema,
  rootCauses: z.array(RootCauseSchema),
  suggestions: z.array(z.string()),
  summary: z.string(),
});
export type ReviewAnalyzeResult = z.infer<typeof ReviewAnalyzeResultSchema>;

// Review Item - 复盘条目
export const ReviewItemSchema = z.object({
  alertId: z.string(),
  symbol: z.string(),
  name: z.string(),
  action: ActionSchema,
  score: z.number(),
  timestamp: z.string(),
  label: ResultLabelSchema,
  pnl: z.string().optional(),
  rootCauses: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).optional(),
  summary: z.string().optional(),
  snapshotId: z.string().optional(),
});
export type ReviewItem = z.infer<typeof ReviewItemSchema>;

// MCP Agent Envelope - 智能体返回的统一封装
export const AgentEnvelopeSchema = z.object({
  type: z.enum([
    "MarketState",
    "ThemeHeat",
    "SignalExplain",
    "RiskCoach",
    "ReviewAnalyst",
    "Error",
  ]),
  payload: z.unknown(),
  meta: z.object({
    agent: z.string(),
    version: z.string(),
    ts: z.string().datetime(),
    confidence: z.number().min(0).max(1).optional(),
    warnings: z.array(z.string()).optional(),
  }),
});
export type AgentEnvelope = z.infer<typeof AgentEnvelopeSchema>;

// MCP Error
export const MCPErrorSchema = z.object({
  code: z.enum(["INVALID_INPUT", "TIMEOUT", "MODEL_ERROR", "INTERNAL"]),
  message: z.string(),
  retryable: z.boolean(),
});
export type MCPError = z.infer<typeof MCPErrorSchema>;
