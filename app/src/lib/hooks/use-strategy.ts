/**
 * 策略 hooks
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  strategyApi, 
  ContentAsset, 
  ContentAssetCreate, 
  StrategyCard, 
  StrategyDSL,
  DSLValidationResult 
} from '@/lib/api';

/** 内容资产列表 */
export function useContentAssets() {
  return useQuery<ContentAsset[]>({
    queryKey: ['strategy', 'assets'],
    queryFn: strategyApi.listAssets,
  });
}

/** 创建内容资产 */
export function useCreateAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (asset: ContentAssetCreate) => strategyApi.createAsset(asset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy', 'assets'] });
    },
  });
}

/** 策略卡列表 */
export function useStrategyCards() {
  return useQuery<StrategyCard[]>({
    queryKey: ['strategy', 'cards'],
    queryFn: strategyApi.listCards,
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

/** 发布策略 */
export function usePublishCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (strategyId: string) => strategyApi.publishCard(strategyId),
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
