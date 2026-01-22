/**
 * 智能体输入输出类型定义
 */

// 风险灯
export type RiskLight = "GREEN" | "YELLOW" | "RED";

// 市场模式
export type MarketMode = "STRONG" | "DIVERGENCE" | "WEAK" | "CHAOS";

// 题材层级
export type ThemeTier = "MAIN" | "BRANCH" | "FADING";

// Action
export type Action = "ALLOW" | "WATCH" | "BLOCK";

// Trigger Status
export type TriggerStatus = "PASS" | "FAIL" | "MISSING";

// 结果标签
export type ResultLabel = "SUCCESS" | "FAIL" | "SKIP";

// 数据质量
export interface DataQuality {
  isDegraded: boolean;
  dataLagSec?: number;
  missingFields?: string[];
}

// 市场状态
export interface MarketState {
  riskLight: RiskLight;
  bombRate: number;
  limitUpCount: number;
  limitDownCount: number;
  maxStreak: number;
  indexChange?: number;
}

// 题材
export interface Theme {
  name: string;
  tier: ThemeTier;
  strength: number;
  leaders: string[];
  notes?: string;
}

// 持仓组合
export interface Portfolio {
  totalValue: number;
  cash: number;
  positions?: Array<{
    symbol: string;
    quantity: number;
    marketValue: number;
  }>;
  consecutiveLosses?: number;
}

// 策略上下文
export interface StrategyContext {
  dataQuality: DataQuality;
  timestamp: string;
}

// 输入包
export interface InputBundle {
  market: MarketState;
  themes?: Theme[];
  portfolio?: Portfolio;
  strategyContext: StrategyContext;
}

// Trigger
export interface Trigger {
  name: string;
  status: TriggerStatus;
  detail: string;
}

// 聚合项
export interface AggregatedItem {
  score: number;
  action: Action;
  confidence: number;
  tags: string[];
  triggers: Trigger[];
  planHint?: {
    maxSinglePosition: number;
  };
}

// Policy 决策
export interface PolicyDecision {
  allowNewTrades: boolean;
  maxTotalPosition: number;
  maxSinglePosition: number;
  reason: string;
}

// 结果
export interface Outcome {
  label: ResultLabel;
  pnl?: number;
  notes?: string;
}

// Agent Envelope
export interface AgentEnvelope<T> {
  type: string;
  payload: T;
  meta: {
    agent: string;
    version: string;
    ts: string;
    confidence?: number;
    warnings?: string[];
  };
}
