import { z } from "zod";

// Risk Light
export const RiskLightSchema = z.enum(["GREEN", "YELLOW", "RED"]);
export type RiskLight = z.infer<typeof RiskLightSchema>;

// Market Mode
export const MarketModeSchema = z.enum(["STRONG", "DIVERGENCE", "WEAK", "CHAOS"]);
export type MarketMode = z.infer<typeof MarketModeSchema>;

// Data Quality
export const DataQualitySchema = z.object({
  isDegraded: z.boolean(),
  dataLagSec: z.number().optional(),
  missingFields: z.array(z.string()).optional(),
});
export type DataQuality = z.infer<typeof DataQualitySchema>;

// Market State
export const MarketStateSchema = z.object({
  riskLight: RiskLightSchema,
  bombRate: z.number().min(0).max(1),
  limitUpCount: z.number().int().min(0),
  limitDownCount: z.number().int().min(0),
  maxStreak: z.number().int().min(0),
  indexChange: z.number().optional(),
});
export type MarketState = z.infer<typeof MarketStateSchema>;

// Theme Tier
export const ThemeTierSchema = z.enum(["MAIN", "BRANCH", "FADING"]);
export type ThemeTier = z.infer<typeof ThemeTierSchema>;

// Theme
export const ThemeSchema = z.object({
  name: z.string(),
  tier: ThemeTierSchema,
  strength: z.number().min(0).max(1),
  leaders: z.array(z.string()),
  notes: z.string().optional(),
});
export type Theme = z.infer<typeof ThemeSchema>;

// Candidate Stock Features
export const CandidateFeaturesSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  resealSpeedSec: z.number().optional(),
  openCount: z.number().int().optional(),
  volume: z.number().optional(),
  pullback5m: z.number().optional(),
  themeTags: z.array(z.string()).optional(),
});
export type CandidateFeatures = z.infer<typeof CandidateFeaturesSchema>;

// Input Bundle - 策略引擎的统一输入
export const InputBundleSchema = z.object({
  market: MarketStateSchema,
  themes: z.array(ThemeSchema).optional(),
  candidates: z.array(CandidateFeaturesSchema).optional(),
  portfolio: z.object({
    totalValue: z.number(),
    cash: z.number(),
    positions: z.array(z.object({
      symbol: z.string(),
      quantity: z.number(),
      marketValue: z.number(),
    })).optional(),
    consecutiveLosses: z.number().int().optional(),
  }).optional(),
  strategyContext: z.object({
    dataQuality: DataQualitySchema,
    timestamp: z.string().datetime(),
  }),
});
export type InputBundle = z.infer<typeof InputBundleSchema>;

// Market State Agent Result
export const MarketStateResultSchema = z.object({
  mode: MarketModeSchema,
  riskLight: RiskLightSchema,
  reasons: z.array(z.object({
    key: z.string(),
    value: z.union([z.number(), z.string()]),
    rule: z.string(),
  })),
  suggestedRisk: z.object({
    allowNewTrades: z.boolean(),
    maxTotalPosition: z.number().min(0).max(1),
    maxSinglePosition: z.number().min(0).max(1),
  }),
});
export type MarketStateResult = z.infer<typeof MarketStateResultSchema>;

// Theme Heat Agent Result
export const ThemeHeatResultSchema = z.object({
  topThemes: z.array(z.object({
    name: z.string(),
    tier: ThemeTierSchema,
    strength: z.number(),
    leaders: z.array(z.string()),
    notes: z.string().optional(),
  })),
  avoidThemes: z.array(z.object({
    name: z.string(),
    reason: z.string(),
  })),
});
export type ThemeHeatResult = z.infer<typeof ThemeHeatResultSchema>;
