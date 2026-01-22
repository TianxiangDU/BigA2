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
  Zap,
  PauseCircle,
  PlayCircle,
  Flame,
  Target,
  Activity,
} from "lucide-react";
import { useIndices, useMarketSentiment, useLimitUpStocks } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * 判断当前是否为A股交易时间
 */
function isTradingTime(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = hours * 60 + minutes;

  const morningStart = 9 * 60 + 30;
  const morningEnd = 11 * 60 + 30;
  const afternoonStart = 13 * 60;
  const afternoonEnd = 15 * 60;

  return (
    (time >= morningStart && time <= morningEnd) ||
    (time >= afternoonStart && time <= afternoonEnd)
  );
}

/**
 * 获取交易状态
 */
function getTradingStatus(date: Date): { text: string; isTrading: boolean } {
  const day = date.getDay();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = hours * 60 + minutes;

  if (day === 0 || day === 6) {
    return { text: "周末休市", isTrading: false };
  }

  if (time >= 9 * 60 + 30 && time <= 11 * 60 + 30) {
    return { text: "上午盘", isTrading: true };
  }
  if (time > 11 * 60 + 30 && time < 13 * 60) {
    return { text: "午间休市", isTrading: false };
  }
  if (time >= 13 * 60 && time <= 15 * 60) {
    return { text: "下午盘", isTrading: true };
  }
  if (time < 9 * 60 + 30) {
    return { text: "盘前", isTrading: false };
  }
  return { text: "已收盘", isTrading: false };
}

/**
 * 格式化北京时间
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * 指数卡片组件
 */
function IndexCard({
  name,
  price,
  change,
  changePct,
  loading,
}: {
  name: string;
  price: number;
  change: number;
  changePct: number;
  loading?: boolean;
}) {
  const isUp = changePct >= 0;
  const colorClass = isUp
    ? "text-[oklch(var(--stock-up))]"
    : "text-[oklch(var(--stock-down))]";

  if (loading) {
    return (
      <div className="text-center p-3 bg-muted/30 rounded-lg">
        <Skeleton className="h-4 w-12 mx-auto mb-2" />
        <Skeleton className="h-6 w-16 mx-auto mb-1" />
        <Skeleton className="h-3 w-14 mx-auto" />
      </div>
    );
  }

  return (
    <div className="text-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="text-xs text-muted-foreground mb-1">{name}</div>
      <div className={cn("text-xl font-bold", colorClass)}>
        {price > 0 ? price.toFixed(2) : "--"}
      </div>
      <div className={cn("text-sm", colorClass)}>
        {changePct >= 0 ? "+" : ""}
        {changePct.toFixed(2)}%
      </div>
      <div className={cn("text-xs", colorClass)}>
        {change >= 0 ? "+" : ""}
        {change.toFixed(2)}
      </div>
    </div>
  );
}

/**
 * 情绪指标卡片
 */
function SentimentCard({
  label,
  value,
  subLabel,
  color = "default",
  loading,
}: {
  label: string;
  value: string | number;
  subLabel?: string;
  color?: "up" | "down" | "warning" | "default" | "strong";
  loading?: boolean;
}) {
  const colorMap = {
    up: "text-[oklch(var(--stock-up))]",
    down: "text-[oklch(var(--stock-down))]",
    warning: "text-[oklch(var(--risk-yellow))]",
    strong: "text-[oklch(var(--stock-up))]",
    default: "text-foreground",
  };

  if (loading) {
    return (
      <div className="text-center p-4 bg-card rounded-lg border">
        <Skeleton className="h-8 w-16 mx-auto mb-2" />
        <Skeleton className="h-4 w-12 mx-auto" />
      </div>
    );
  }

  return (
    <div className="text-center p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors">
      <div className={cn("text-3xl font-bold", colorMap[color])}>{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
      {subLabel && (
        <div className="text-xs text-muted-foreground mt-0.5">{subLabel}</div>
      )}
    </div>
  );
}

/**
 * 涨停板列表项
 */
function LimitUpItem({
  rank,
  symbol,
  name,
  price,
  changePct,
  amount,
}: {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  amount: number;
}) {
  const market = symbol.startsWith("6")
    ? "沪"
    : symbol.startsWith("0") || symbol.startsWith("3")
    ? "深"
    : "创";

  const marketColor =
    market === "沪"
      ? "bg-blue-500/10 text-blue-600"
      : market === "深"
      ? "bg-orange-500/10 text-orange-600"
      : "bg-purple-500/10 text-purple-600";

  return (
    <div className="flex items-center justify-between py-3 px-2 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
            rank <= 3
              ? "bg-[oklch(var(--stock-up))] text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          {rank}
        </span>
        <span className="font-mono text-sm">{symbol}</span>
        <span className="font-medium">{name}</span>
        <Badge variant="secondary" className={cn("text-xs", marketColor)}>
          {market}
        </Badge>
      </div>
      <div className="text-right">
        <div className="text-[oklch(var(--stock-up))] font-bold">
          {price.toFixed(2)}
        </div>
        <div className="text-[oklch(var(--stock-up))] text-sm">
          +{changePct.toFixed(2)}%
        </div>
        <div className="text-xs text-muted-foreground">
          {(amount / 100000000).toFixed(2)}亿
        </div>
      </div>
    </div>
  );
}

export function MarketDashboard() {
  const [beijingTime, setBeijingTime] = useState<Date>(new Date());
  const [tradingStatus, setTradingStatus] = useState(
    getTradingStatus(new Date())
  );

  // 数据获取
  const {
    data: indices,
    isLoading: indicesLoading,
    refetch: refetchIndices,
  } = useIndices(true);
  const {
    data: sentiment,
    isLoading: sentimentLoading,
    refetch: refetchSentiment,
  } = useMarketSentiment(true);
  const {
    data: limitUpStocks,
    isLoading: limitUpLoading,
    refetch: refetchLimitUp,
  } = useLimitUpStocks();

  // 更新北京时间
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setBeijingTime(now);
      setTradingStatus(getTradingStatus(now));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 交易时间内自动刷新
  useEffect(() => {
    if (!tradingStatus.isTrading) return;

    const timer = setInterval(() => {
      refetchIndices();
      refetchSentiment();
      refetchLimitUp();
    }, 5000);

    return () => clearInterval(timer);
  }, [tradingStatus.isTrading, refetchIndices, refetchSentiment, refetchLimitUp]);

  // 手动刷新
  const handleRefresh = useCallback(() => {
    refetchIndices();
    refetchSentiment();
    refetchLimitUp();
  }, [refetchIndices, refetchSentiment, refetchLimitUp]);

  const isLoading = indicesLoading || sentimentLoading;

  return (
    <div className="space-y-4">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flame className="h-5 w-5 text-[oklch(var(--stock-up))]" />
          <span className="font-bold text-lg">打板提示</span>
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
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-mono font-medium text-foreground">
              {formatTime(beijingTime)}
            </span>
          </div>
          {tradingStatus.isTrading && (
            <span className="text-xs text-[oklch(var(--stock-up))]">5s</span>
          )}
          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-muted rounded-full transition-colors"
            title="刷新"
          >
            <RefreshCw
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
          </button>
        </div>
      </div>

      {/* 指数行情卡片 */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {indices && indices.length > 0
              ? indices.map((index) => (
                  <IndexCard
                    key={index.code}
                    name={index.name}
                    price={index.price}
                    change={index.change}
                    changePct={index.change_pct}
                    loading={indicesLoading}
                  />
                ))
              : // 默认占位
                ["上证", "深证", "创业板", "科创", "沪深300", "上证50"].map(
                  (name) => (
                    <IndexCard
                      key={name}
                      name={name}
                      price={0}
                      change={0}
                      changePct={0}
                      loading={indicesLoading || !indices}
                    />
                  )
                )}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>数据源: adata (东方财富)</span>
            <span>{sentiment?.update_time || "--:--:--"}</span>
          </div>
        </CardContent>
      </Card>

      {/* 情绪指标 */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <SentimentCard
          label="涨停"
          value={sentiment?.limit_up_count ?? 0}
          color="up"
          loading={sentimentLoading}
        />
        <SentimentCard
          label="跌停"
          value={sentiment?.limit_down_count ?? 0}
          color="down"
          loading={sentimentLoading}
        />
        <SentimentCard
          label="冲板"
          value={sentiment?.rush_count ?? 0}
          color="default"
          loading={sentimentLoading}
        />
        <SentimentCard
          label="炸板率"
          value={sentiment ? `${sentiment.bomb_rate.toFixed(2)}%` : "--"}
          color={
            sentiment && sentiment.bomb_rate > 20
              ? "warning"
              : sentiment && sentiment.bomb_rate < 10
              ? "up"
              : "default"
          }
          loading={sentimentLoading}
        />
        <SentimentCard
          label="连板高度"
          value={
            sentiment && sentiment.max_streak > 0
              ? sentiment.max_streak
              : "-"
          }
          color="default"
          loading={sentimentLoading}
        />
        <SentimentCard
          label="情绪"
          value={sentiment?.sentiment ?? "--"}
          color={
            sentiment?.sentiment === "偏强"
              ? "strong"
              : sentiment?.sentiment === "偏弱"
              ? "down"
              : "default"
          }
          loading={sentimentLoading}
        />
      </div>

      {/* 涨停板列表 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[oklch(var(--stock-up))]" />
              <CardTitle>
                涨停板 ({limitUpStocks?.length ?? 0})
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">排序:</span>
              <Badge variant="outline" className="cursor-pointer">
                涨幅
              </Badge>
              <Badge
                variant="secondary"
                className="cursor-pointer bg-primary/10"
              >
                成交额↓
              </Badge>
              <Badge variant="outline" className="cursor-pointer">
                现价
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {limitUpLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : limitUpStocks && limitUpStocks.length > 0 ? (
            <div className="divide-y">
              {limitUpStocks.slice(0, 10).map((stock, index) => (
                <LimitUpItem
                  key={stock.symbol}
                  rank={index + 1}
                  symbol={stock.symbol}
                  name={stock.name}
                  price={stock.price}
                  changePct={stock.change_pct}
                  amount={stock.amount}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>暂无涨停股数据</p>
              <p className="text-xs mt-1">
                请确保后端服务已启动且当前为交易时间
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 底部提示 */}
      <div className="text-xs text-muted-foreground text-center">
        {tradingStatus.isTrading ? (
          <span className="flex items-center justify-center gap-1">
            <span className="inline-block w-2 h-2 bg-[oklch(var(--stock-up))] rounded-full animate-pulse" />
            数据实时更新中 (每5秒刷新)
          </span>
        ) : (
          <span>休市期间数据不更新，下次交易时间自动开始刷新</span>
        )}
      </div>
    </div>
  );
}
