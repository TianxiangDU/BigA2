/**
 * 统计分析 hooks
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  analyticsApi, 
  AnalyticsSummary,
  PerformanceStats,
  RegimePerformance,
  BlockedStats,
  DailyPnL,
  Attribution,
  // 旧类型兼容
  StrategyPerformance, 
  GroupPerformance, 
} from '@/lib/api';

// ============ 新版 Hooks ============

/** 统计摘要 */
export function useAnalyticsSummary(startDate?: string, endDate?: string) {
  return useQuery<AnalyticsSummary>({
    queryKey: ['analytics', 'summary', startDate, endDate],
    queryFn: () => analyticsApi.getSummary(startDate, endDate),
  });
}

/** 按策略统计 */
export function usePerformanceByStrategy(startDate?: string, endDate?: string) {
  return useQuery<PerformanceStats[]>({
    queryKey: ['analytics', 'by-strategy', startDate, endDate],
    queryFn: () => analyticsApi.getByStrategy(startDate, endDate),
  });
}

/** 按策略组统计 */
export function usePerformanceByGroup(startDate?: string, endDate?: string) {
  return useQuery<PerformanceStats[]>({
    queryKey: ['analytics', 'by-group', startDate, endDate],
    queryFn: () => analyticsApi.getByGroup(startDate, endDate),
  });
}

/** 按市场状态统计 */
export function usePerformanceByRegime(startDate?: string, endDate?: string) {
  return useQuery<RegimePerformance[]>({
    queryKey: ['analytics', 'by-regime', startDate, endDate],
    queryFn: () => analyticsApi.getByRegime(startDate, endDate),
  });
}

/** 拦截统计 */
export function useBlockedStats(startDate?: string, endDate?: string) {
  return useQuery<BlockedStats>({
    queryKey: ['analytics', 'blocked-stats', startDate, endDate],
    queryFn: () => analyticsApi.getBlockedStats(startDate, endDate),
  });
}

/** 每日盈亏曲线 */
export function useDailyPnL(days?: number) {
  return useQuery<DailyPnL[]>({
    queryKey: ['analytics', 'daily-pnl', days],
    queryFn: () => analyticsApi.getDailyPnL(days),
  });
}

/** 归因分析 */
export function useAttribution(alertId?: string, strategyId?: string) {
  return useQuery<Attribution>({
    queryKey: ['analytics', 'attribution', alertId, strategyId],
    queryFn: () => analyticsApi.getAttribution(alertId, strategyId),
  });
}

// ============ 旧版 Hooks 兼容 ============

/** 策略表现（旧版） */
export function useStrategyPerformance(startDate?: string, endDate?: string) {
  return useQuery<StrategyPerformance[]>({
    queryKey: ['analytics', 'strategy-performance', startDate, endDate],
    queryFn: () => analyticsApi.getStrategyPerformance(startDate, endDate),
  });
}

/** 策略组表现（旧版） */
export function useGroupPerformance(startDate?: string, endDate?: string) {
  return useQuery<GroupPerformance[]>({
    queryKey: ['analytics', 'group-performance', startDate, endDate],
    queryFn: () => analyticsApi.getGroupPerformance(startDate, endDate),
  });
}
