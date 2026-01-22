"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  Flame,
  Activity,
  Check,
} from "lucide-react";
import { useIndices, useMarketSentiment, useLimitUpStocks, useLimitDownStocks } from "@/lib/hooks";
import { cn } from "@/lib/utils";

// 市场选项
const MARKET_OPTIONS = [
  { value: "sh", label: "沪市" },
  { value: "sz", label: "深市" },
  { value: "cyb", label: "创业板" },
  { value: "kcb", label: "科创板" },
  { value: "bj", label: "北交所" },
];

const STORAGE_KEY = "market-dashboard-filters";

/**
 * 交易时间判断
 */
function getTradingStatus(date: Date): { text: string; isTrading: boolean } {
  const day = date.getDay();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = hours * 60 + minutes;

  if (day === 0 || day === 6) return { text: "周末休市", isTrading: false };
  if (time >= 9 * 60 + 30 && time <= 11 * 60 + 30) return { text: "上午盘", isTrading: true };
  if (time > 11 * 60 + 30 && time < 13 * 60) return { text: "午间休市", isTrading: false };
  if (time >= 13 * 60 && time <= 15 * 60) return { text: "下午盘", isTrading: true };
  if (time < 9 * 60 + 30) return { text: "盘前", isTrading: false };
  return { text: "已收盘", isTrading: false };
}

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
 * 市场多选筛选器
 */
function MarketFilter({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggleMarket = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((m) => m !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => {
    onChange(MARKET_OPTIONS.map((o) => o.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const isAllSelected = selected.length === MARKET_OPTIONS.length;
  const isNoneSelected = selected.length === 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={isAllSelected ? clearAll : selectAll}
        className={cn(
          "px-3 py-1.5 text-sm rounded-lg transition-colors border",
          isNoneSelected || isAllSelected
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-muted hover:bg-muted/80 text-muted-foreground border-transparent"
        )}
      >
        全部
      </button>
      <div className="w-px h-6 bg-border" />
      {MARKET_OPTIONS.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggleMarket(opt.value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 border",
              isSelected
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-muted hover:bg-muted/80 text-muted-foreground border-transparent"
            )}
          >
            {isSelected && <Check className="h-3 w-3" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 指数卡片
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
      <div
        className="text-xl font-bold"
        style={{ color: isUp ? "#dc2626" : "#16a34a" }}
      >
        {price > 0 ? price.toFixed(2) : "--"}
      </div>
      <div
        className="text-sm"
        style={{ color: isUp ? "#dc2626" : "#16a34a" }}
      >
        {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
      </div>
      <div
        className="text-xs"
        style={{ color: isUp ? "#dc2626" : "#16a34a" }}
      >
        {change >= 0 ? "+" : ""}{change.toFixed(2)}
      </div>
    </div>
  );
}

/**
 * 情绪指标卡片 - 只有数字颜色变化，背景和边框保持一致
 */
function SentimentCard({
  label,
  value,
  color = "default",
  loading,
}: {
  label: string;
  value: string | number;
  color?: "up" | "down" | "warning" | "default" | "strong";
  loading?: boolean;
}) {
  // 只有数字颜色变化
  const textColors = {
    up: "#dc2626",      // 红色
    down: "#16a34a",    // 绿色
    warning: "#ca8a04", // 黄色
    strong: "#dc2626",  // 红色
    default: "inherit",
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
    <div className="text-center p-4 rounded-lg border bg-card transition-colors">
      <div className="text-3xl font-bold" style={{ color: textColors[color] }}>
        {value}
      </div>
      <div className="text-sm mt-1 text-muted-foreground">{label}</div>
    </div>
  );
}

/**
 * 涨停/跌停列表项
 */
function LimitStockItem({
  rank,
  symbol,
  name,
  price,
  changePct,
  amount,
  isUp = true,
}: {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  amount: number;
  isUp?: boolean;
}) {
  const market = symbol.startsWith("6")
    ? "沪"
    : symbol.startsWith("00")
    ? "深"
    : symbol.startsWith("30")
    ? "创"
    : symbol.startsWith("68")
    ? "科"
    : "北";

  const marketColor =
    market === "沪" ? "bg-blue-500/10 text-blue-600" :
    market === "深" ? "bg-orange-500/10 text-orange-600" :
    market === "创" ? "bg-purple-500/10 text-purple-600" :
    market === "科" ? "bg-cyan-500/10 text-cyan-600" :
    "bg-amber-500/10 text-amber-600";

  const priceColor = isUp ? "#dc2626" : "#16a34a";
  const rankBgColor = isUp ? "#dc2626" : "#16a34a";

  return (
    <div className="flex items-center justify-between py-2 px-2 hover:bg-muted/50 rounded transition-colors text-sm">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className="w-5 h-5 rounded flex items-center justify-center text-xs font-medium flex-shrink-0"
          style={{
            backgroundColor: rank <= 3 ? rankBgColor : undefined,
            color: rank <= 3 ? "white" : undefined,
          }}
        >
          {rank}
        </span>
        <span className="font-mono text-xs text-muted-foreground">{symbol}</span>
        <span className="font-medium truncate">{name}</span>
        <Badge variant="secondary" className={cn("text-xs flex-shrink-0", marketColor)}>
          {market}
        </Badge>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <div className="font-bold" style={{ color: priceColor }}>
          {price.toFixed(2)}
        </div>
        <div className="text-xs" style={{ color: priceColor }}>
          {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
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
  const [tradingStatus, setTradingStatus] = useState(getTradingStatus(new Date()));
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 从 localStorage 读取筛选器状态
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSelectedMarkets(parsed);
        }
      } catch {
        // 忽略解析错误
      }
    }
    setIsInitialized(true);
  }, []);

  // 保存筛选器状态到 localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedMarkets));
    }
  }, [selectedMarkets, isInitialized]);

  // 计算用于 API 的市场参数
  const marketParam = selectedMarkets.length === 0 || selectedMarkets.length === MARKET_OPTIONS.length
    ? undefined
    : selectedMarkets.join(",");

  // 数据获取
  const { data: indices, isLoading: indicesLoading, refetch: refetchIndices } = useIndices(true);
  const { data: sentiment, isLoading: sentimentLoading, refetch: refetchSentiment } = useMarketSentiment(marketParam, true);
  const { data: limitUpStocks, isLoading: limitUpLoading, refetch: refetchLimitUp } = useLimitUpStocks(marketParam, true);
  const { data: limitDownStocks, isLoading: limitDownLoading, refetch: refetchLimitDown } = useLimitDownStocks(marketParam, true);

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setBeijingTime(now);
      setTradingStatus(getTradingStatus(now));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 自动刷新
  useEffect(() => {
    if (!tradingStatus.isTrading) return;

    const timer = setInterval(() => {
      refetchIndices();
      refetchSentiment();
      refetchLimitUp();
      refetchLimitDown();
    }, 5000);

    return () => clearInterval(timer);
  }, [tradingStatus.isTrading, refetchIndices, refetchSentiment, refetchLimitUp, refetchLimitDown]);

  const handleRefresh = useCallback(() => {
    refetchIndices();
    refetchSentiment();
    refetchLimitUp();
    refetchLimitDown();
  }, [refetchIndices, refetchSentiment, refetchLimitUp, refetchLimitDown]);

  const isLoading = indicesLoading || sentimentLoading;

  return (
    <div className="space-y-4">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Flame className="h-5 w-5" style={{ color: "#dc2626" }} />
          <span className="font-bold text-lg">打板提示</span>
          <Badge
            variant={tradingStatus.isTrading ? "default" : "secondary"}
            className={tradingStatus.isTrading ? "animate-pulse" : ""}
            style={tradingStatus.isTrading ? { backgroundColor: "#dc2626" } : undefined}
          >
            {tradingStatus.isTrading ? <PlayCircle className="h-3 w-3 mr-1" /> : <PauseCircle className="h-3 w-3 mr-1" />}
            {tradingStatus.text}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-mono font-medium text-foreground">{formatTime(beijingTime)}</span>
          </div>
          {tradingStatus.isTrading && <span className="text-xs" style={{ color: "#dc2626" }}>5s</span>}
          <button onClick={handleRefresh} className="p-1.5 hover:bg-muted rounded-full transition-colors" title="刷新">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* 市场筛选 */}
      <MarketFilter selected={selectedMarkets} onChange={setSelectedMarkets} />

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
              : ["上证", "深证", "创业板", "科创", "沪深300", "上证50"].map((name) => (
                  <IndexCard key={name} name={name} price={0} change={0} changePct={0} loading={indicesLoading || !indices} />
                ))}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>数据源: 东方财富</span>
            <span>{sentiment?.update_time || "--:--:--"}</span>
          </div>
        </CardContent>
      </Card>

      {/* 情绪指标 - 红绿色标识 */}
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
          label="上涨"
          value={sentiment?.up_count ?? 0}
          color="up"
          loading={sentimentLoading}
        />
        <SentimentCard
          label="下跌"
          value={sentiment?.down_count ?? 0}
          color="down"
          loading={sentimentLoading}
        />
        <SentimentCard
          label="炸板率"
          value={sentiment ? `${sentiment.bomb_rate.toFixed(1)}%` : "--"}
          color={sentiment && sentiment.bomb_rate > 20 ? "warning" : sentiment && sentiment.bomb_rate < 10 ? "up" : "default"}
          loading={sentimentLoading}
        />
        <SentimentCard
          label="情绪"
          value={sentiment?.sentiment ?? "--"}
          color={sentiment?.sentiment === "偏强" ? "strong" : sentiment?.sentiment === "偏弱" ? "down" : "default"}
          loading={sentimentLoading}
        />
      </div>

      {/* 涨停和跌停并排显示 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 涨停板列表 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" style={{ color: "#dc2626" }} />
              <CardTitle style={{ color: "#dc2626" }}>
                涨停板 ({limitUpStocks?.length ?? 0})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {limitUpLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : limitUpStocks && limitUpStocks.length > 0 ? (
              <ScrollArea className="h-[400px] pr-2">
                <div className="space-y-1">
                  {limitUpStocks.map((stock, index) => (
                    <LimitStockItem
                      key={stock.symbol}
                      rank={index + 1}
                      symbol={stock.symbol}
                      name={stock.name}
                      price={stock.price}
                      changePct={stock.change_pct}
                      amount={stock.amount}
                      isUp={true}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>暂无涨停股</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 跌停板列表 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" style={{ color: "#16a34a" }} />
              <CardTitle style={{ color: "#16a34a" }}>
                跌停板 ({limitDownStocks?.length ?? 0})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {limitDownLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : limitDownStocks && limitDownStocks.length > 0 ? (
              <ScrollArea className="h-[400px] pr-2">
                <div className="space-y-1">
                  {limitDownStocks.map((stock, index) => (
                    <LimitStockItem
                      key={stock.symbol}
                      rank={index + 1}
                      symbol={stock.symbol}
                      name={stock.name}
                      price={stock.price}
                      changePct={stock.change_pct}
                      amount={stock.amount}
                      isUp={false}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>暂无跌停股</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 底部提示 */}
      <div className="text-xs text-muted-foreground text-center">
        {tradingStatus.isTrading ? (
          <span className="flex items-center justify-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "#dc2626" }}
            />
            数据实时更新中 (每5秒刷新)
          </span>
        ) : (
          <span>休市期间数据不更新，下次交易时间自动开始刷新</span>
        )}
      </div>
    </div>
  );
}
