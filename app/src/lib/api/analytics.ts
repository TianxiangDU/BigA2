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
};
