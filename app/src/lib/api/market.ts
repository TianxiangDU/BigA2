/**
 * 市场数据 API
 */
import { api } from './client';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
  amount: number;
  open: number;
  high: number;
  low: number;
  pre_close: number;
  update_time: string;
}

export interface StockInfo {
  symbol: string;
  name: string;
  industry: string;
  market: string;
}

export interface MarketOverview {
  up_count: number;
  down_count: number;
  flat_count: number;
  limit_up_count: number;
  limit_down_count: number;
  total_amount: number;
  north_flow: number;
  update_time: string;
}

export interface IndexQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  update_time: string;
}

export interface MarketSentiment {
  limit_up_count: number;
  limit_down_count: number;
  up_count: number;
  down_count: number;
  flat_count: number;
  rush_count: number;
  bomb_count: number;
  bomb_rate: number;
  max_streak: number;
  sentiment: string;
  total_amount: number;
  update_time: string;
}

export interface KlineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
}

export const marketApi = {
  /** 获取市场概览 */
  getOverview: () => api.get<MarketOverview>('/market/overview'),
  
  /** 获取主要指数行情 */
  getIndices: () => api.get<IndexQuote[]>('/market/indices'),
  
  /** 获取市场情绪数据 */
  getSentiment: () => api.get<MarketSentiment>('/market/sentiment'),
  
  /** 获取股票列表 */
  getStockList: (market?: string) => 
    api.get<StockInfo[]>('/market/stocks', { market }),
  
  /** 获取单个股票行情 */
  getQuote: (symbol: string) => 
    api.get<StockQuote>(`/market/quote/${symbol}`),
  
  /** 批量获取行情 */
  getBatchQuotes: (symbols: string[]) => 
    api.post<StockQuote[]>('/market/quotes', symbols),
  
  /** 获取涨停股列表 */
  getLimitUpStocks: () => 
    api.get<StockQuote[]>('/market/limit-up'),
  
  /** 获取K线数据 */
  getKline: (symbol: string, startDate: string, endDate?: string) =>
    api.get<KlineData[]>(`/market/kline/${symbol}`, { start_date: startDate, end_date: endDate }),
};
