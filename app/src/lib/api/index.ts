/**
 * API 模块导出
 */
export { api } from './client';

// 市场数据
export { marketApi } from './market';
export type { StockQuote, StockInfo, MarketOverview, KlineData, IndexQuote, MarketSentiment } from './market';

// 策略
export { strategyApi } from './strategy';
export type { 
  ContentAsset, 
  ContentAssetCreate, 
  ContentAssetListResponse,
  StrategyDSL, 
  StrategyCard, 
  StrategyCardVersion,
  DSLValidationResult,
  StrategyGroup,
  StrategyGroupConfig,
  StrategyRunResult,
} from './strategy';

// 模拟盘
export { paperApi } from './paper';
export type { PaperOrder, PaperPosition, PaperStats, PaperTrade, OrderCreate } from './paper';

// 统计分析
export { analyticsApi } from './analytics';
export type { 
  AnalyticsSummary,
  PerformanceStats,
  RegimePerformance,
  BlockedStats,
  DailyPnL, 
  Attribution,
  // 旧类型兼容
  StrategyPerformance, 
  GroupPerformance, 
} from './analytics';
