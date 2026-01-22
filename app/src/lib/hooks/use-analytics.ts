/**
 * 统计分析 hooks
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  analyticsApi, 
  StrategyPerformance, 
  GroupPerformance, 
  DailyPnL,
  Attribution 
} from '@/lib/api';

/** 策略表现 */
export function useStrategyPerformance(startDate?: string, endDate?: string) {
  return useQuery<StrategyPerformance[]>({
    queryKey: ['analytics', 'strategy-performance', startDate, endDate],
    queryFn: () => analyticsApi.getStrategyPerformance(startDate, endDate),
  });
}

/** 策略组表现 */
export function useGroupPerformance(startDate?: string, endDate?: string) {
  return useQuery<GroupPerformance[]>({
    queryKey: ['analytics', 'group-performance', startDate, endDate],
    queryFn: () => analyticsApi.getGroupPerformance(startDate, endDate),
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
