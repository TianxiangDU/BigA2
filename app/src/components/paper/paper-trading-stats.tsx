"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Percent, BarChart3, Wallet } from "lucide-react";
import { usePaperStats } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function PaperTradingStats() {
  const { data: stats, isLoading, error } = usePaperStats();

  if (error) {
    return (
      <Card className="col-span-4">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            加载统计数据失败，请检查后端服务
          </p>
        </CardContent>
      </Card>
    );
  }

  const statItems: StatItem[] = [
    {
      label: "总盈亏",
      value: stats ? `${stats.total_pnl >= 0 ? "+" : ""}${stats.total_pnl.toFixed(2)}` : "--",
      icon: <TrendingUp className="h-4 w-4" />,
      trend: stats ? (stats.total_pnl >= 0 ? "up" : "down") : "neutral",
    },
    {
      label: "胜率",
      value: stats ? `${stats.win_rate.toFixed(1)}%` : "--",
      icon: <Percent className="h-4 w-4" />,
      trend: stats ? (stats.win_rate >= 50 ? "up" : "down") : "neutral",
    },
    {
      label: "交易次数",
      value: stats ? `${stats.trade_count}` : "--",
      icon: <BarChart3 className="h-4 w-4" />,
      trend: "neutral",
    },
    {
      label: "持仓市值",
      value: stats ? `${stats.market_value.toFixed(2)}` : "--",
      icon: <Wallet className="h-4 w-4" />,
      trend: "neutral",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {statItems.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <div className="text-muted-foreground">{stat.icon}</div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div
                className={cn(
                  "text-2xl font-bold",
                  stat.trend === "up" && "text-stock-up",
                  stat.trend === "down" && "text-stock-down"
                )}
              >
                {stat.value}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
