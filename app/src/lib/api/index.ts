/**
 * API 模块导出
 */
export { api } from './client';
export { marketApi } from './market';
export type { StockQuote, StockInfo, MarketOverview, KlineData, IndexQuote, MarketSentiment } from './market';
export { strategyApi } from './strategy';
export type { ContentAsset, ContentAssetCreate, StrategyDSL, StrategyCard, DSLValidationResult } from './strategy';
export { paperApi } from './paper';
export type { PaperOrder, PaperPosition, PaperStats, PaperTrade, OrderCreate } from './paper';
export { analyticsApi } from './analytics';
export type { StrategyPerformance, GroupPerformance, DailyPnL, Attribution } from './analytics';
