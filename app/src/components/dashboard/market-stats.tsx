"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Zap, DollarSign } from "lucide-react";
import { useMarketOverview } from "@/lib/hooks";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
}

function StatCard({ title, value, description, icon, trend, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p
                className={`text-xs ${
                  trend === "up"
                    ? "text-[oklch(var(--stock-up))]"
                    : trend === "down"
                    ? "text-[oklch(var(--stock-down))]"
                    : "text-muted-foreground"
                }`}
              >
                {description}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function MarketStats() {
  const { data: overview, isLoading, error } = useMarketOverview();

  if (error) {
    return (
      <Card className="col-span-3">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            加载市场数据失败，请检查后端服务是否启动
          </p>
        </CardContent>
      </Card>
    );
  }

  // 计算炸板率 (简化版)
  const bombRate = overview
    ? overview.limit_up_count > 0
      ? ((overview.limit_up_count - overview.up_count * 0.1) / overview.limit_up_count).toFixed(1)
      : "0"
    : "0";

  return (
    <>
      <StatCard
        title="涨停数"
        value={overview?.limit_up_count ?? 0}
        description={`上涨 ${overview?.up_count ?? 0} / 下跌 ${overview?.down_count ?? 0}`}
        icon={<TrendingUp className="h-4 w-4" />}
        trend="up"
        loading={isLoading}
      />
      <StatCard
        title="跌停数"
        value={overview?.limit_down_count ?? 0}
        description={`平盘 ${overview?.flat_count ?? 0}`}
        icon={<TrendingDown className="h-4 w-4" />}
        trend="down"
        loading={isLoading}
      />
      <StatCard
        title="成交额"
        value={overview ? `${(overview.total_amount / 100000000).toFixed(0)}亿` : "0亿"}
        description={`更新时间: ${overview?.update_time ?? "--:--:--"}`}
        icon={<DollarSign className="h-4 w-4" />}
        trend="neutral"
        loading={isLoading}
      />
    </>
  );
}
