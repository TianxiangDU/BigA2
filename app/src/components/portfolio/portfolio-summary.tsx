"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, Percent, AlertTriangle, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

interface PortfolioData {
  total_value: number;
  cash: number;
  market_value: number;
  today_pnl: number;
  today_pnl_percent: number;
  total_position: number;
  consecutive_losses: number;
}

export function PortfolioSummary() {
  const { data, isLoading } = useQuery<PortfolioData>({
    queryKey: ["paper", "portfolio"],
    queryFn: () => api.get<PortfolioData>("/paper/portfolio"),
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-2 opacity-50" />
          <p>暂无持仓数据</p>
          <p className="text-sm">开始模拟交易后显示</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "总资产",
      value: `¥${(data.total_value / 10000).toFixed(2)}万`,
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: "今日盈亏",
      value: `${data.today_pnl >= 0 ? "+" : ""}¥${data.today_pnl.toLocaleString()}`,
      subValue: `${data.today_pnl_percent >= 0 ? "+" : ""}${data.today_pnl_percent.toFixed(2)}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      trend: data.today_pnl >= 0 ? "up" : "down",
    },
    {
      label: "总仓位",
      value: `${(data.total_position * 100).toFixed(0)}%`,
      subValue: `现金 ¥${(data.cash / 10000).toFixed(2)}万`,
      icon: <Percent className="h-4 w-4" />,
    },
    {
      label: "连亏次数",
      value: data.consecutive_losses.toString(),
      subValue: data.consecutive_losses >= 2 ? "需要降低仓位" : "状态正常",
      icon: <AlertTriangle className="h-4 w-4" />,
      trend: data.consecutive_losses >= 2 ? "down" : "neutral",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
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
              style={{
                color: stat.trend === "up" ? "#dc2626" : stat.trend === "down" ? "#16a34a" : undefined
              }}
            >
              {stat.value}
            </div>
            {stat.subValue && (
              <p className="text-xs text-muted-foreground">{stat.subValue}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
