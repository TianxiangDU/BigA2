/**
 * 模拟盘 hooks
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paperApi, PaperOrder, PaperPosition, PaperStats, OrderCreate } from '@/lib/api';

/** 订单列表 */
export function usePaperOrders(status?: string) {
  return useQuery<PaperOrder[]>({
    queryKey: ['paper', 'orders', status],
    queryFn: () => paperApi.listOrders(status),
  });
}

/** 创建订单 */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (order: OrderCreate) => paperApi.createOrder(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paper', 'orders'] });
    },
  });
}

/** 成交订单 */
export function useFillOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId: string) => paperApi.fillOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paper'] });
    },
  });
}

/** 持仓列表 */
export function usePaperPositions() {
  return useQuery<PaperPosition[]>({
    queryKey: ['paper', 'positions'],
    queryFn: paperApi.listPositions,
    refetchInterval: 10000, // 10秒刷新
  });
}

/** 模拟盘统计 */
export function usePaperStats() {
  return useQuery<PaperStats>({
    queryKey: ['paper', 'stats'],
    queryFn: paperApi.getStats,
    refetchInterval: 30000, // 30秒刷新
  });
}
