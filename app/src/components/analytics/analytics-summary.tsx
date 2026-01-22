"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Percent, BarChart3, Target, AlertTriangle, Activity, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

interface AnalyticsSummaryData {
  total_trades: number;
  win_rate: number;
  total_pnl_pct: number;
  profit_loss_ratio: number;
  max_drawdown: number;
  block_rate: number;
}

interface StatItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

export function AnalyticsSummary() {
  const { data, isLoading } = useQuery<AnalyticsSummaryData>({
    queryKey: ["analytics", "summary"],
    queryFn: () => api.get<AnalyticsSummaryData>("/analytics/summary"),
    staleTime: 60000,
  });

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

  if (!data) {
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
      value: data.total_trades.toString(),
      icon: <Activity className="h-4 w-4" />,
      description: "本月",
    },
    {
      label: "总胜率",
      value: `${data.win_rate.toFixed(1)}%`,
      icon: <Target className="h-4 w-4" />,
      trend: data.win_rate >= 50 ? "up" : "down",
    },
    {
      label: "总盈亏",
      value: `${data.total_pnl_pct >= 0 ? "+" : ""}${data.total_pnl_pct.toFixed(1)}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      trend: data.total_pnl_pct >= 0 ? "up" : "down",
    },
    {
      label: "盈亏比",
      value: data.profit_loss_ratio.toFixed(2),
      icon: <BarChart3 className="h-4 w-4" />,
      trend: data.profit_loss_ratio >= 1.5 ? "up" : data.profit_loss_ratio < 1 ? "down" : "neutral",
    },
    {
      label: "最大回撤",
      value: `${data.max_drawdown.toFixed(1)}%`,
      icon: <AlertTriangle className="h-4 w-4" />,
      trend: "down",
    },
    {
      label: "风控拦截率",
      value: `${data.block_rate.toFixed(1)}%`,
      icon: <Percent className="h-4 w-4" />,
      trend: "neutral",
    },
  ];

  const getColor = (trend?: "up" | "down" | "neutral") => {
    if (trend === "up") return "#dc2626";
    if (trend === "down") return "#16a34a";
    return undefined;
  };

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
              className="text-2xl font-bold"
              style={{ color: getColor(stat.trend) }}
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
