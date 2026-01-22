/**
 * 市场数据 hooks
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { marketApi, StockQuote, MarketOverview, KlineData, IndexQuote, MarketSentiment } from '@/lib/api';

/** 市场概览 */
export function useMarketOverview() {
  return useQuery<MarketOverview>({
    queryKey: ['market', 'overview'],
    queryFn: marketApi.getOverview,
    refetchInterval: 5000, // 5秒刷新
    staleTime: 3000,
  });
}

/** 主要指数行情 */
export function useIndices(enabled: boolean = true) {
  return useQuery<IndexQuote[]>({
    queryKey: ['market', 'indices'],
    queryFn: marketApi.getIndices,
    enabled,
    refetchInterval: enabled ? 5000 : false,
    staleTime: 3000,
  });
}

/** 市场情绪数据 */
export function useMarketSentiment(market?: string, enabled: boolean = true) {
  return useQuery<MarketSentiment>({
    queryKey: ['market', 'sentiment', market],
    queryFn: () => marketApi.getSentiment(market),
    enabled,
    refetchInterval: enabled ? 5000 : false,
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
export function useLimitUpStocks(market?: string, enabled: boolean = true) {
  return useQuery<StockQuote[]>({
    queryKey: ['market', 'limit-up', market],
    queryFn: () => marketApi.getLimitUpStocks(market),
    enabled,
    refetchInterval: enabled ? 10000 : false,
    staleTime: 5000,
  });
}

/** 跌停股列表 */
export function useLimitDownStocks(market?: string, enabled: boolean = true) {
  return useQuery<StockQuote[]>({
    queryKey: ['market', 'limit-down', market],
    queryFn: () => marketApi.getLimitDownStocks(market),
    enabled,
    refetchInterval: enabled ? 10000 : false,
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
