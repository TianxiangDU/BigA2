/**
 * 策略 API
 */
import { api } from './client';

export interface ContentAsset {
  id: number;
  type: 'TEXT' | 'IMAGE' | 'VIDEO_LINK';
  title: string;
  raw_text?: string;
  source_url?: string;
  notes?: string;
  created_at: string;
}

export interface ContentAssetCreate {
  type: string;
  title: string;
  raw_text?: string;
  source_url?: string;
  attachments?: string[];
  notes?: string;
}

export interface StrategyDSL {
  id: string;
  version: string;
  name: string;
  description?: string;
  params?: Record<string, unknown>;
  entry_conditions?: Array<{
    indicator: string;
    operator: string;
    threshold: number;
    description?: string;
  }>;
  exit_conditions?: Array<{
    indicator: string;
    operator: string;
    threshold: number;
    description?: string;
  }>;
  risk_rules?: Array<{
    type: string;
    threshold: number;
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

export interface DSLValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const strategyApi = {
  // 内容资产
  listAssets: () => api.get<ContentAsset[]>('/strategy/assets'),
  createAsset: (asset: ContentAssetCreate) => api.post<ContentAsset>('/strategy/assets', asset),
  
  // 策略卡
  listCards: () => api.get<StrategyCard[]>('/strategy/cards'),
  createCard: (data: { name: string; dsl: StrategyDSL; source_asset_ids?: number[] }) =>
    api.post<StrategyCard>('/strategy/cards', data),
  getCard: (strategyId: string) => api.get<{ card: StrategyCard; versions: unknown[] }>(`/strategy/cards/${strategyId}`),
  publishCard: (strategyId: string) => api.post<{ status: string }>(`/strategy/cards/${strategyId}/publish`),
  
  // DSL 校验
  validateDSL: (dsl: StrategyDSL) => api.post<DSLValidationResult>('/strategy/validate-dsl', dsl),
  
  // 策略草案生成
  generateDraft: (assetIds: number[], strategyType?: string) =>
    api.post<{ draft: StrategyDSL; source_assets: Array<{ id: number; title: string }> }>(
      '/strategy/generate-draft',
      { asset_ids: assetIds, strategy_type: strategyType || 'momentum' }
    ),
};
