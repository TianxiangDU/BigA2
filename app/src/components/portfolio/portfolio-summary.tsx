"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Percent, AlertTriangle } from "lucide-react";

export function PortfolioSummary() {
  // Mock data
  const data = {
    totalValue: 1250000,
    cash: 375000,
    marketValue: 875000,
    todayPnL: 12500,
    todayPnLPercent: 1.01,
    totalPosition: 0.7,
    consecutiveLosses: 0,
  };

  const stats = [
    {
      label: "总资产",
      value: `¥${(data.totalValue / 10000).toFixed(2)}万`,
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: "今日盈亏",
      value: `${data.todayPnL >= 0 ? "+" : ""}¥${data.todayPnL.toLocaleString()}`,
      subValue: `${data.todayPnLPercent >= 0 ? "+" : ""}${data.todayPnLPercent.toFixed(2)}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      trend: data.todayPnL >= 0 ? "up" : "down",
    },
    {
      label: "总仓位",
      value: `${(data.totalPosition * 100).toFixed(0)}%`,
      subValue: `现金 ¥${(data.cash / 10000).toFixed(2)}万`,
      icon: <Percent className="h-4 w-4" />,
    },
    {
      label: "连亏次数",
      value: data.consecutiveLosses.toString(),
      subValue: data.consecutiveLosses >= 2 ? "需要降低仓位" : "状态正常",
      icon: <AlertTriangle className="h-4 w-4" />,
      trend: data.consecutiveLosses >= 2 ? "down" : "neutral",
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
              className={`text-2xl font-bold ${
                stat.trend === "up"
                  ? "text-stock-up"
                  : stat.trend === "down"
                  ? "text-stock-down"
                  : ""
              }`}
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
