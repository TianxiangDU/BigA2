"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  Activity,
  DollarSign,
  Zap,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { useMarketOverview } from "@/lib/hooks";

/**
 * 判断当前是否为A股交易时间
 * 交易时间：周一至周五 9:30-11:30, 13:00-15:00
 */
function isTradingTime(date: Date): boolean {
  const day = date.getDay();
  // 周末不开盘
  if (day === 0 || day === 6) return false;

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = hours * 60 + minutes; // 转换为分钟数

  // 上午 9:30 - 11:30
  const morningStart = 9 * 60 + 30; // 9:30
  const morningEnd = 11 * 60 + 30; // 11:30

  // 下午 13:00 - 15:00
  const afternoonStart = 13 * 60; // 13:00
  const afternoonEnd = 15 * 60; // 15:00

  return (
    (time >= morningStart && time <= morningEnd) ||
    (time >= afternoonStart && time <= afternoonEnd)
  );
}

/**
 * 获取交易状态文本
 */
function getTradingStatus(date: Date): { text: string; isTrading: boolean } {
  const day = date.getDay();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = hours * 60 + minutes;

  if (day === 0 || day === 6) {
    return { text: "周末休市", isTrading: false };
  }

  // 上午 9:30 - 11:30
  if (time >= 9 * 60 + 30 && time <= 11 * 60 + 30) {
    return { text: "上午交易中", isTrading: true };
  }

  // 午间休市 11:30 - 13:00
  if (time > 11 * 60 + 30 && time < 13 * 60) {
    return { text: "午间休市", isTrading: false };
  }

  // 下午 13:00 - 15:00
  if (time >= 13 * 60 && time <= 15 * 60) {
    return { text: "下午交易中", isTrading: true };
  }

  // 盘前 9:30 之前
  if (time < 9 * 60 + 30) {
    return { text: "盘前准备", isTrading: false };
  }

  // 收盘后
  return { text: "已收盘", isTrading: false };
}

/**
 * 格式化北京时间
 */
function formatBeijingTime(date: Date): string {
  return date.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * 格式化金额（亿）
 */
function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(2)}亿`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(2)}万`;
  }
  return amount.toFixed(2);
}

export function MarketDashboard() {
  const [beijingTime, setBeijingTime] = useState<Date>(new Date());
  const [tradingStatus, setTradingStatus] = useState(getTradingStatus(new Date()));
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // 使用 React Query 获取市场数据
  // 根据是否为交易时间动态设置刷新间隔
  const { data: overview, isLoading, error, refetch, dataUpdatedAt } = useMarketOverview();

  // 更新北京时间（每秒）
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setBeijingTime(now);
      setTradingStatus(getTradingStatus(now));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 交易时间内自动刷新数据（每5秒）
  useEffect(() => {
    if (!tradingStatus.isTrading) return;

    const timer = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(timer);
  }, [tradingStatus.isTrading, refetch]);

  // 更新最后刷新时间
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastRefresh(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  // 手动刷新
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">
            加载市场数据失败，请检查后端服务是否启动
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* 头部：时间和状态 */}
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">股市行情看板</CardTitle>
            <Badge
              variant={tradingStatus.isTrading ? "default" : "secondary"}
              className={
                tradingStatus.isTrading
                  ? "bg-[oklch(var(--stock-up))] animate-pulse"
                  : ""
              }
            >
              {tradingStatus.isTrading ? (
                <PlayCircle className="h-3 w-3 mr-1" />
              ) : (
                <PauseCircle className="h-3 w-3 mr-1" />
              )}
              {tradingStatus.text}
            </Badge>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            title="手动刷新"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* 时间显示 */}
        <div className="flex flex-wrap gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>北京时间：</span>
            <span className="font-mono font-medium text-foreground">
              {formatBeijingTime(beijingTime)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>数据更新：</span>
            <span className="font-mono text-foreground">
              {lastRefresh ? formatBeijingTime(lastRefresh) : "--"}
            </span>
            {tradingStatus.isTrading && (
              <span className="text-xs text-muted-foreground">(每5秒刷新)</span>
            )}
          </div>
        </div>
      </CardHeader>

      {/* 主要数据 */}
      <CardContent className="pt-6">
        {isLoading && !overview ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 涨停数 */}
            <div className="bg-[oklch(var(--stock-up)/0.1)] rounded-lg p-4 border border-[oklch(var(--stock-up)/0.2)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">涨停数</span>
                <TrendingUp className="h-4 w-4 text-[oklch(var(--stock-up))]" />
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-[oklch(var(--stock-up))]">
                  {overview?.limit_up_count ?? 0}
                </span>
                <span className="text-sm text-muted-foreground ml-2">只</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                上涨 {overview?.up_count ?? 0} 只
              </div>
            </div>

            {/* 跌停数 */}
            <div className="bg-[oklch(var(--stock-down)/0.1)] rounded-lg p-4 border border-[oklch(var(--stock-down)/0.2)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">跌停数</span>
                <TrendingDown className="h-4 w-4 text-[oklch(var(--stock-down))]" />
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-[oklch(var(--stock-down))]">
                  {overview?.limit_down_count ?? 0}
                </span>
                <span className="text-sm text-muted-foreground ml-2">只</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                下跌 {overview?.down_count ?? 0} 只
              </div>
            </div>

            {/* 成交额 */}
            <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">成交额</span>
                <DollarSign className="h-4 w-4 text-accent-foreground" />
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  {overview ? formatAmount(overview.total_amount) : "--"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                两市合计
              </div>
            </div>

            {/* 涨跌比 */}
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">涨跌比</span>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xl font-bold text-[oklch(var(--stock-up))]">
                  {overview?.up_count ?? 0}
                </span>
                <span className="text-muted-foreground">:</span>
                <span className="text-xl font-bold text-[oklch(var(--stock-down))]">
                  {overview?.down_count ?? 0}
                </span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden flex">
                {overview && (overview.up_count + overview.down_count) > 0 && (
                  <>
                    <div
                      className="bg-[oklch(var(--stock-up))] h-full transition-all duration-500"
                      style={{
                        width: `${
                          (overview.up_count /
                            (overview.up_count + overview.down_count + overview.flat_count)) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className="bg-muted-foreground/30 h-full transition-all duration-500"
                      style={{
                        width: `${
                          (overview.flat_count /
                            (overview.up_count + overview.down_count + overview.flat_count)) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className="bg-[oklch(var(--stock-down))] h-full transition-all duration-500"
                      style={{
                        width: `${
                          (overview.down_count /
                            (overview.up_count + overview.down_count + overview.flat_count)) *
                          100
                        }%`,
                      }}
                    />
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                平盘 {overview?.flat_count ?? 0} 只
              </div>
            </div>
          </div>
        )}

        {/* 底部提示 */}
        <div className="mt-4 text-xs text-muted-foreground text-center">
          {tradingStatus.isTrading ? (
            <span className="flex items-center justify-center gap-1">
              <span className="inline-block w-2 h-2 bg-[oklch(var(--stock-up))] rounded-full animate-pulse" />
              数据实时更新中
            </span>
          ) : (
            <span>休市期间数据不更新，下次交易时间自动开始刷新</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
