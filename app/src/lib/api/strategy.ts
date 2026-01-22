/**
 * 策略 API
 */
import { api } from './client';

// ============ 内容资产 ============

export interface ContentAsset {
  id: number;
  type: 'TEXT' | 'IMAGE' | 'VIDEO_LINK' | 'PDF';
  title: string;
  raw_text?: string;
  source_url?: string;
  attachments?: Array<{ name: string; url: string }>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentAssetCreate {
  type: string;
  title: string;
  raw_text?: string;
  source_url?: string;
  attachments?: Array<{ name: string; url: string }>;
  notes?: string;
}

export interface ContentAssetListResponse {
  items: ContentAsset[];
  total: number;
  page: number;
  page_size: number;
}

// ============ 策略卡 DSL ============

export interface StrategyDSL {
  id: string;
  version: string;
  name: string;
  description?: string;
  params?: Record<string, unknown>;
  entry_conditions?: Array<{
    indicator: string;
    operator: string;
    threshold?: number;
    value?: unknown;
    description?: string;
  }>;
  exit_conditions?: Array<{
    indicator: string;
    operator: string;
    threshold?: number;
    value?: unknown;
    description?: string;
  }>;
  risk_rules?: Array<{
    type: string;
    threshold?: number;
    description?: string;
  }>;
  tags?: string[];
}

export interface StrategyCard {
  id: number;
  strategy_id: string;
  name: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
  current_version: string;
  created_at: string;
}

export interface StrategyCardVersion {
  id: number;
  version: string;
  dsl: StrategyDSL;
  source_asset_ids?: number[];
  published_at?: string;
  created_at: string;
}

export interface DSLValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// ============ 策略组 ============

export interface StrategyGroupConfig {
  strategies: Array<{
    strategy_id: string;
    version?: string;
    weight?: number;
  }>;
  aggregation: 'vote' | 'weighted' | 'unanimous';
  conflict_policy: 'conservative' | 'aggressive';
  market_routing?: Record<string, unknown>;
}

export interface StrategyGroup {
  id: number;
  group_id: string;
  name: string;
  config: StrategyGroupConfig;
  enabled: boolean;
  created_at: string;
}

export interface StrategyRunResult {
  run_id: string;
  group_id: string;
  symbol: string;
  snapshot: Record<string, unknown>;
  per_strategy_results: Array<{
    strategy_id: string;
    version: string;
    weight: number;
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasons: string[];
  }>;
  aggregated_result: {
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    action: 'ALLOW' | 'WATCH' | 'BLOCK';
  };
  runtime_ms: number;
}

// ============ API 函数 ============

export const strategyApi = {
  // 内容资产 (新 API)
  listContentAssets: (params?: { page?: number; page_size?: number; type?: string; search?: string }) =>
    api.get<ContentAssetListResponse>('/content-assets', params),
  getContentAsset: (id: number) => api.get<ContentAsset>(`/content-assets/${id}`),
  createContentAsset: (data: ContentAssetCreate) => api.post<ContentAsset>('/content-assets', data),
  updateContentAsset: (id: number, data: Partial<ContentAssetCreate>) =>
    api.put<ContentAsset>(`/content-assets/${id}`, data),
  deleteContentAsset: (id: number) => api.delete(`/content-assets/${id}`),
  
  // 内容资产 (旧 API 兼容)
  listAssets: () => api.get<ContentAsset[]>('/strategy/assets'),
  createAsset: (asset: ContentAssetCreate) => api.post<ContentAsset>('/strategy/assets', asset),
  
  // 策略卡
  listCards: () => api.get<StrategyCard[]>('/strategy/cards'),
  createCard: (data: { name: string; dsl: StrategyDSL; source_asset_ids?: number[] }) =>
    api.post<StrategyCard>('/strategy/cards', data),
  getCard: (strategyId: string) =>
    api.get<{ card: StrategyCard; versions: StrategyCardVersion[] }>(`/strategy/cards/${strategyId}`),
  
  // 策略卡版本
  listVersions: (strategyId: string) =>
    api.get<{ strategy_id: string; current_version: string; versions: StrategyCardVersion[] }>(
      `/strategy/cards/${strategyId}/versions`
    ),
  createVersion: (strategyId: string, data: { version: string; dsl: Record<string, unknown>; source_asset_ids?: number[] }) =>
    api.post(`/strategy/cards/${strategyId}/versions`, data),
  
  // 策略发布
  publishCard: (strategyId: string, version?: string) =>
    api.post<{ status: string; message: string }>(`/strategy/cards/${strategyId}/publish`, undefined, {
      params: version ? { version } : undefined,
    }),
  deprecateCard: (strategyId: string) =>
    api.post<{ status: string }>(`/strategy/cards/${strategyId}/deprecate`),
  
  // DSL 校验
  validateDSL: (dsl: StrategyDSL) => api.post<DSLValidationResult>('/strategy/validate-dsl', dsl),
  
  // 策略草案生成
  generateDraft: (assetIds: number[], strategyType?: string) =>
    api.post<{ draft: StrategyDSL; source_assets: Array<{ id: number; title: string }> }>(
      '/strategy/generate-draft',
      { asset_ids: assetIds, strategy_type: strategyType || 'momentum' }
    ),
  
  // 策略组
  listGroups: () => api.get<StrategyGroup[]>('/strategy/groups'),
  getGroup: (groupId: string) =>
    api.get<{
      group: StrategyGroup;
      recent_runs: Array<{
        run_id: string;
        ts: string;
        input_hash: string;
        runtime_ms: number;
        aggregated_result: Record<string, unknown>;
        warnings: string[];
      }>;
    }>(`/strategy/groups/${groupId}`),
  createGroup: (data: { name: string; config: StrategyGroupConfig }) =>
    api.post<StrategyGroup>('/strategy/groups', data),
  updateGroup: (groupId: string, data: { name: string; config: StrategyGroupConfig }) =>
    api.put(`/strategy/groups/${groupId}`, data),
  toggleGroup: (groupId: string) =>
    api.post<{ status: string; enabled: boolean }>(`/strategy/groups/${groupId}/toggle`),
  
  // 运行策略组
  runGroup: (groupId: string, symbol: string, snapshot?: Record<string, unknown>) =>
    api.post<StrategyRunResult>(`/strategy/groups/${groupId}/run`, { symbol, snapshot }),
  
  // 策略列表（包括卡和组）
  list: () =>
    api.get<{
      cards: Array<{ id: string; name: string; version: string; status: string; type: 'card' }>;
      groups: Array<{ id: string; name: string; enabled: boolean; type: 'group' }>;
    }>('/strategy/list'),
};
