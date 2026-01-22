/**
 * 市场数据 hooks
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { marketApi, StockQuote, MarketOverview, KlineData } from '@/lib/api';

/** 市场概览 */
export function useMarketOverview() {
  return useQuery<MarketOverview>({
    queryKey: ['market', 'overview'],
    queryFn: marketApi.getOverview,
    refetchInterval: 5000, // 5秒刷新
    staleTime: 3000,
  });
}

/** 单个股票行情 */
export function useStockQuote(symbol: string) {
  return useQuery<StockQuote>({
    queryKey: ['market', 'quote', symbol],
    queryFn: () => marketApi.getQuote(symbol),
    enabled: !!symbol,
    refetchInterval: 3000, // 3秒刷新
    staleTime: 2000,
  });
}

/** 批量股票行情 */
export function useBatchQuotes(symbols: string[]) {
  return useQuery<StockQuote[]>({
    queryKey: ['market', 'quotes', symbols],
    queryFn: () => marketApi.getBatchQuotes(symbols),
    enabled: symbols.length > 0,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

/** 涨停股列表 */
export function useLimitUpStocks() {
  return useQuery<StockQuote[]>({
    queryKey: ['market', 'limit-up'],
    queryFn: marketApi.getLimitUpStocks,
    refetchInterval: 10000, // 10秒刷新
    staleTime: 5000,
  });
}

/** K线数据 */
export function useKline(symbol: string, startDate: string, endDate?: string) {
  return useQuery<KlineData[]>({
    queryKey: ['market', 'kline', symbol, startDate, endDate],
    queryFn: () => marketApi.getKline(symbol, startDate, endDate),
    enabled: !!symbol && !!startDate,
    staleTime: 60000, // 1分钟
  });
}
