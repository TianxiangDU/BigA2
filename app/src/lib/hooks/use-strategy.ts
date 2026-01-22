/**
 * 策略 hooks
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  strategyApi, 
  ContentAsset, 
  ContentAssetCreate, 
  ContentAssetListResponse,
  StrategyCard, 
  StrategyDSL,
  DSLValidationResult,
  StrategyGroup,
  StrategyGroupConfig,
} from '@/lib/api';

// ============ 内容资产 Hooks ============

/** 内容资产列表（新版分页） */
export function useContentAssetList(params?: { 
  page?: number; 
  page_size?: number; 
  type?: string; 
  search?: string;
}) {
  return useQuery<ContentAssetListResponse>({
    queryKey: ['content-assets', params],
    queryFn: () => strategyApi.listContentAssets(params),
  });
}

/** 内容资产列表（旧版兼容） */
export function useContentAssets() {
  return useQuery<ContentAsset[]>({
    queryKey: ['strategy', 'assets'],
    queryFn: strategyApi.listAssets,
  });
}

/** 单个内容资产 */
export function useContentAsset(id: number) {
  return useQuery<ContentAsset>({
    queryKey: ['content-assets', id],
    queryFn: () => strategyApi.getContentAsset(id),
    enabled: id > 0,
  });
}

/** 创建内容资产 */
export function useCreateContentAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ContentAssetCreate) => strategyApi.createContentAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-assets'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'assets'] });
    },
  });
}

/** 更新内容资产 */
export function useUpdateContentAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ContentAssetCreate> }) =>
      strategyApi.updateContentAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-assets'] });
    },
  });
}

/** 删除内容资产 */
export function useDeleteContentAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => strategyApi.deleteContentAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-assets'] });
    },
  });
}

/** 创建内容资产（旧版兼容） */
export function useCreateAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (asset: ContentAssetCreate) => strategyApi.createAsset(asset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy', 'assets'] });
    },
  });
}

// ============ 策略卡 Hooks ============

/** 策略卡列表 */
export function useStrategyCards() {
  return useQuery<StrategyCard[]>({
    queryKey: ['strategy', 'cards'],
    queryFn: strategyApi.listCards,
  });
}

/** 单个策略卡详情 */
export function useStrategyCard(strategyId: string) {
  return useQuery({
    queryKey: ['strategy', 'cards', strategyId],
    queryFn: () => strategyApi.getCard(strategyId),
    enabled: !!strategyId,
  });
}

/** 策略卡版本列表 */
export function useStrategyVersions(strategyId: string) {
  return useQuery({
    queryKey: ['strategy', 'versions', strategyId],
    queryFn: () => strategyApi.listVersions(strategyId),
    enabled: !!strategyId,
  });
}

/** 创建策略卡 */
export function useCreateCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; dsl: StrategyDSL; source_asset_ids?: number[] }) => 
      strategyApi.createCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy', 'cards'] });
    },
  });
}

/** 创建新版本 */
export function useCreateVersion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ strategyId, data }: { 
      strategyId: string; 
      data: { version: string; dsl: Record<string, unknown>; source_asset_ids?: number[] };
    }) => strategyApi.createVersion(strategyId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['strategy', 'cards', variables.strategyId] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'versions', variables.strategyId] });
    },
  });
}

/** 发布策略 */
export function usePublishCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ strategyId, version }: { strategyId: string; version?: string }) =>
      strategyApi.publishCard(strategyId, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy', 'cards'] });
    },
  });
}

/** 废弃策略 */
export function useDeprecateCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (strategyId: string) => strategyApi.deprecateCard(strategyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy', 'cards'] });
    },
  });
}

/** DSL 校验 */
export function useValidateDSL() {
  return useMutation<DSLValidationResult, Error, StrategyDSL>({
    mutationFn: (dsl: StrategyDSL) => strategyApi.validateDSL(dsl),
  });
}

/** 生成策略草案 */
export function useGenerateDraft() {
  return useMutation({
    mutationFn: ({ assetIds, strategyType }: { assetIds: number[]; strategyType?: string }) =>
      strategyApi.generateDraft(assetIds, strategyType),
  });
}

// ============ 策略组 Hooks ============

/** 策略组列表 */
export function useStrategyGroups() {
  return useQuery<StrategyGroup[]>({
    queryKey: ['strategy', 'groups'],
    queryFn: strategyApi.listGroups,
  });
}

/** 单个策略组详情 */
export function useStrategyGroup(groupId: string) {
  return useQuery({
    queryKey: ['strategy', 'groups', groupId],
    queryFn: () => strategyApi.getGroup(groupId),
    enabled: !!groupId,
  });
}

/** 创建策略组 */
export function useCreateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; config: StrategyGroupConfig }) =>
      strategyApi.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy', 'groups'] });
    },
  });
}

/** 更新策略组 */
export function useUpdateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupId, data }: { 
      groupId: string; 
      data: { name: string; config: StrategyGroupConfig };
    }) => strategyApi.updateGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy', 'groups'] });
    },
  });
}

/** 启用/禁用策略组 */
export function useToggleGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (groupId: string) => strategyApi.toggleGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy', 'groups'] });
    },
  });
}

/** 运行策略组 */
export function useRunGroup() {
  return useMutation({
    mutationFn: ({ groupId, symbol, snapshot }: { 
      groupId: string; 
      symbol: string; 
      snapshot?: Record<string, unknown>;
    }) => strategyApi.runGroup(groupId, symbol, snapshot),
  });
}

/** 策略列表（包括卡和组） */
export function useStrategyList() {
  return useQuery({
    queryKey: ['strategy', 'list'],
    queryFn: strategyApi.list,
  });
}
