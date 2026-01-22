/**
 * 模拟盘 API
 */
import { api } from './client';

export interface PaperOrder {
  order_id: string;
  symbol: string;
  name?: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  status: 'pending' | 'filled' | 'cancelled';
  alert_id?: string;
  strategy_id?: string;
  created_at: string;
}

export interface OrderCreate {
  symbol: string;
  name?: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  alert_id?: string;
  strategy_id?: string;
  group_id?: string;
}

export interface PaperPosition {
  symbol: string;
  name?: string;
  qty: number;
  avg_cost: number;
  current_price?: number;
  unrealized_pnl: number;
  pnl_pct: number;
}

export interface PaperStats {
  total_pnl: number;
  trade_count: number;
  win_rate: number;
  market_value: number;
}

export interface PaperTrade {
  trade_id: string;
  order_id: string;
  symbol: string;
  side: string;
  fill_qty: number;
  fill_price: number;
  pnl: number;
  strategy_id?: string;
  group_id?: string;
  created_at: string;
}

export const paperApi = {
  // 订单
  listOrders: (status?: string) => api.get<PaperOrder[]>('/paper/orders', { status }),
  createOrder: (order: OrderCreate) => api.post<PaperOrder>('/paper/orders', order),
  fillOrder: (orderId: string) => api.post<{ status: string; pnl: number }>(`/paper/orders/${orderId}/fill`),
  
  // 持仓
  listPositions: () => api.get<PaperPosition[]>('/paper/positions'),
  
  // 成交
  listTrades: (strategyId?: string, groupId?: string) =>
    api.get<PaperTrade[]>('/paper/trades', { strategy_id: strategyId, group_id: groupId }),
  
  // 统计
  getStats: () => api.get<PaperStats>('/paper/stats'),
};
