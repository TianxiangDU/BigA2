/**
 * 统计分析 API
 */
import { api } from './client';

// ============ 类型定义 ============

export interface PerformanceStats {
  id: string;
  name: string;
  trade_count: number;
  win_count: number;
  lose_count: number;
  win_rate: number;
  total_pnl: number;
  avg_pnl: number;
  max_pnl: number;
  min_pnl: number;
  max_drawdown: number;
  sharpe_ratio: number;
  blocked_count: number;
  block_rate: number;
}

export interface AnalyticsSummary {
  total_trades: number;
  total_pnl: number;
  overall_win_rate: number;
  best_strategy: string | null;
  worst_strategy: string | null;
  avg_holding_days: number;
  total_blocked: number;
}

export interface RegimePerformance {
  regime: string;
  name: string;
  trade_count: number;
  win_count: number;
  win_rate: number;
  total_pnl: number;
  avg_pnl: number;
}

export interface BlockedStats {
  total_signals: number;
  blocked_count: number;
  blocked_rate: number;
  watched_count: number;
  allowed_count: number;
  block_reasons: Array<{ reason: string; count: number }>;
}

export interface DailyPnL {
  date: string;
  pnl: number;
  trade_count: number;
  cumulative_pnl: number;
}

export interface Attribution {
  by_strategy: Record<string, { pnl: number; count: number }>;
  by_group: Record<string, { pnl: number; count: number }>;
  by_alert: Record<string, { pnl: number; count: number }>;
}

// 旧接口兼容
export interface StrategyPerformance {
  strategy_id: string;
  trade_count: number;
  win_count: number;
  win_rate: number;
  total_pnl: number;
  avg_pnl: number;
  max_pnl: number;
  min_pnl: number;
}

export interface GroupPerformance {
  group_id: string;
  trade_count: number;
  win_count: number;
  win_rate: number;
  total_pnl: number;
}

// ============ API 函数 ============

export const analyticsApi = {
  /** 获取统计摘要 */
  getSummary: (startDate?: string, endDate?: string) =>
    api.get<AnalyticsSummary>('/analytics/summary', {
      start_date: startDate,
      end_date: endDate,
    }),
  
  /** 按策略统计绩效 */
  getByStrategy: (startDate?: string, endDate?: string) =>
    api.get<PerformanceStats[]>('/analytics/by-strategy', {
      start_date: startDate,
      end_date: endDate,
    }),
  
  /** 按策略组统计绩效 */
  getByGroup: (startDate?: string, endDate?: string) =>
    api.get<PerformanceStats[]>('/analytics/by-group', {
      start_date: startDate,
      end_date: endDate,
    }),
  
  /** 按市场状态统计绩效 */
  getByRegime: (startDate?: string, endDate?: string) =>
    api.get<RegimePerformance[]>('/analytics/by-regime', {
      start_date: startDate,
      end_date: endDate,
    }),
  
  /** 获取拦截统计 */
  getBlockedStats: (startDate?: string, endDate?: string) =>
    api.get<BlockedStats>('/analytics/blocked-stats', {
      start_date: startDate,
      end_date: endDate,
    }),
  
  /** 获取每日盈亏曲线 */
  getDailyPnL: (days?: number) =>
    api.get<DailyPnL[]>('/analytics/daily-pnl', { days }),
  
  /** 获取归因分析 */
  getAttribution: (alertId?: string, strategyId?: string) =>
    api.get<Attribution>('/analytics/attribution', {
      alert_id: alertId,
      strategy_id: strategyId,
    }),
  
  // 旧接口兼容
  getStrategyPerformance: (startDate?: string, endDate?: string) =>
    api.get<StrategyPerformance[]>('/analytics/by-strategy', {
      start_date: startDate,
      end_date: endDate,
    }),
  
  getGroupPerformance: (startDate?: string, endDate?: string) =>
    api.get<GroupPerformance[]>('/analytics/by-group', {
      start_date: startDate,
      end_date: endDate,
    }),
  
  // ============ 风控统计 ============
  
  /** 获取风控统计 */
  getRiskStats: (params?: { startDate?: string; endDate?: string; groupId?: string }) =>
    api.get<RiskStats>('/analytics/risk', {
      start_date: params?.startDate,
      end_date: params?.endDate,
      group_id: params?.groupId,
    }),
  
  /** 获取风控决策列表 */
  getRiskDecisions: (params?: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) =>
    api.get<RiskDecisionList>('/analytics/risk/decisions', {
      page: params?.page,
      page_size: params?.pageSize,
      start_date: params?.startDate,
      end_date: params?.endDate,
    }),
  
  /** 获取风控有效性分析 */
  getRiskEffectiveness: (startDate?: string, endDate?: string) =>
    api.get<RiskEffectiveness>('/analytics/risk/effectiveness', {
      start_date: startDate,
      end_date: endDate,
    }),
};

// ============ 风控类型 ============

export interface RiskStats {
  total_decisions: number;
  hard_gate_blocked: number;
  hard_gate_block_rate: number;
  adjustments_downgrade: number;
  adjustments_block: number;
  adjustment_rate: number;
  by_reason: Array<{ reason: string; count: number; rate: number }>;
  by_regime: Array<{ regime: string; count: number; rate: number }>;
  by_risk_light: Array<{ risk_light: string; count: number; rate: number }>;
}

export interface RiskDecision {
  decision_id: string;
  ts: string;
  run_id?: string;
  input_hash?: string;
  hard_gate?: {
    allow_new_trades: boolean;
    blocked_reason?: string;
    triggered_rules: Array<{ rule: string; value: unknown; threshold: unknown; impact: string }>;
  };
  regime?: {
    regime: string;
    risk_light: string;
    recommended_groups: string[];
    suggested_topk: number;
    reasons: Array<{ key: string; value: unknown; rule: string; impact: string }>;
  };
  risk_budget?: {
    allow_new_trades_suggested: boolean;
    max_total_position: number;
    max_single_position: number;
    max_new_trades: number;
    theme_exposure_caps: Record<string, number>;
    cooldown: { enabled: boolean; until_ts?: string; reason?: string };
  };
  adjustments?: {
    downgrades: Array<{ symbol: string; to_action: string; reason: string; source: string }>;
    blocks: Array<{ symbol: string; to_action: string; reason: string; source: string }>;
  };
  meta?: Record<string, unknown>;
}

export interface RiskDecisionList {
  items: RiskDecision[];
  total: number;
  page: number;
  page_size: number;
}

export interface RiskEffectiveness {
  blocked_count: number;
  executed_count: number;
  executed_win_rate: number;
  executed_total_pnl: number;
  executed_avg_pnl: number;
  analysis: {
    note: string;
    requires_followup_price_data: boolean;
  };
}
