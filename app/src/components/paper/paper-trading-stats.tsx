"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Percent, BarChart3, AlertTriangle } from "lucide-react";

interface StatItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function PaperTradingStats() {
  const stats: StatItem[] = [
    {
      label: "总盈亏",
      value: "+12.5%",
      icon: <TrendingUp className="h-4 w-4" />,
      trend: "up",
    },
    {
      label: "胜率",
      value: "62.5%",
      icon: <Percent className="h-4 w-4" />,
      trend: "neutral",
    },
    {
      label: "盈亏比",
      value: "1.85",
      icon: <BarChart3 className="h-4 w-4" />,
      trend: "up",
    },
    {
      label: "最大回撤",
      value: "-5.2%",
      icon: <AlertTriangle className="h-4 w-4" />,
      trend: "down",
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
