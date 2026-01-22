"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Percent, Target, Shield, Activity, Inbox, Trophy, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalyticsSummary, useBlockedStats } from "@/lib/hooks";

interface StatItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

export function AnalyticsSummary() {
  const { data: summary, isLoading: loadingSummary } = useAnalyticsSummary();
  const { data: blockedStats, isLoading: loadingBlocked } = useBlockedStats();
  
  const isLoading = loadingSummary || loadingBlocked;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary || summary.total_trades === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-2 opacity-50" />
          <p>暂无统计数据</p>
          <p className="text-sm">执行交易后开始统计</p>
        </CardContent>
      </Card>
    );
  }

  const stats: StatItem[] = [
    {
      label: "总交易次数",
      value: summary.total_trades.toString(),
      icon: <Activity className="h-4 w-4" />,
    },
    {
      label: "总胜率",
      value: `${summary.overall_win_rate.toFixed(1)}%`,
      icon: <Target className="h-4 w-4" />,
      trend: summary.overall_win_rate >= 50 ? "up" : "down",
    },
    {
      label: "总盈亏",
      value: `${summary.total_pnl >= 0 ? "+" : ""}${summary.total_pnl.toFixed(0)}`,
      icon: <TrendingUp className="h-4 w-4" />,
      trend: summary.total_pnl >= 0 ? "up" : "down",
    },
    {
      label: "最佳策略",
      value: summary.best_strategy || "-",
      icon: <Trophy className="h-4 w-4" />,
      trend: "up",
    },
    {
      label: "风控拦截",
      value: blockedStats?.blocked_count.toString() || "0",
      icon: <Shield className="h-4 w-4" />,
      description: blockedStats ? `${blockedStats.blocked_rate.toFixed(1)}%` : undefined,
    },
    {
      label: "最差策略",
      value: summary.worst_strategy || "-",
      icon: <AlertCircle className="h-4 w-4" />,
      trend: "down",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <div className="text-muted-foreground">{stat.icon}</div>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                stat.trend === "up" && "text-stock-up",
                stat.trend === "down" && "text-stock-down"
              )}
            >
              {stat.value}
            </div>
            {stat.description && (
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
