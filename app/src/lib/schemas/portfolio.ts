import { z } from "zod";

// Position
export const PositionSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  costPrice: z.number().positive(),
  currentPrice: z.number().positive(),
  marketValue: z.number().positive(),
  pnl: z.number(),
  pnlPercent: z.number(),
  positionRatio: z.number().min(0).max(1),
});
export type Position = z.infer<typeof PositionSchema>;

// Portfolio
export const PortfolioSchema = z.object({
  totalValue: z.number().positive(),
  cash: z.number().min(0),
  marketValue: z.number().min(0),
  todayPnL: z.number(),
  todayPnLPercent: z.number(),
  totalPosition: z.number().min(0).max(1),
  consecutiveLosses: z.number().int().min(0),
  positions: z.array(PositionSchema),
});
export type Portfolio = z.infer<typeof PortfolioSchema>;

// Order Direction
export const OrderDirectionSchema = z.enum(["buy", "sell"]);
export type OrderDirection = z.infer<typeof OrderDirectionSchema>;

// Order Status
export const OrderStatusSchema = z.enum(["pending", "filled", "cancelled"]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

// Paper Order
export const PaperOrderSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  direction: OrderDirectionSchema,
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  status: OrderStatusSchema,
  alertId: z.string().optional(),
  snapshotId: z.string().optional(),
  createdAt: z.string().datetime(),
  filledAt: z.string().datetime().optional(),
});
export type PaperOrder = z.infer<typeof PaperOrderSchema>;

// Paper Trading Stats
export const PaperTradingStatsSchema = z.object({
  totalPnL: z.number(),
  totalPnLPercent: z.number(),
  winRate: z.number().min(0).max(1),
  profitLossRatio: z.number().min(0),
  maxDrawdown: z.number().max(0),
  totalTrades: z.number().int().min(0),
  winTrades: z.number().int().min(0),
  lossTrades: z.number().int().min(0),
});
export type PaperTradingStats = z.infer<typeof PaperTradingStatsSchema>;

// Risk Coach Result
export const RiskCoachResultSchema = z.object({
  allowNewTrades: z.boolean(),
  maxTotalPosition: z.number().min(0).max(1),
  maxSinglePosition: z.number().min(0).max(1),
  notes: z.array(z.string()),
});
export type RiskCoachResult = z.infer<typeof RiskCoachResultSchema>;
