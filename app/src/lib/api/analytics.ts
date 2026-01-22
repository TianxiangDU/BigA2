/**
 * 统计分析 API
 */
import { api } from './client';

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

export const analyticsApi = {
  /** 获取策略表现 */
  getStrategyPerformance: (startDate?: string, endDate?: string) =>
    api.get<StrategyPerformance[]>('/analytics/strategy-performance', {
      start_date: startDate,
      end_date: endDate,
    }),
  
  /** 获取策略组表现 */
  getGroupPerformance: (startDate?: string, endDate?: string) =>
    api.get<GroupPerformance[]>('/analytics/group-performance', {
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
};
