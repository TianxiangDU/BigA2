"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Percent, BarChart3, Target, AlertTriangle, Activity } from "lucide-react";

interface StatItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

export function AnalyticsSummary() {
  const stats: StatItem[] = [
    {
      label: "总交易次数",
      value: "156",
      icon: <Activity className="h-4 w-4" />,
      description: "本月",
    },
    {
      label: "总胜率",
      value: "61.5%",
      icon: <Target className="h-4 w-4" />,
      trend: "up",
    },
    {
      label: "总盈亏",
      value: "+18.6%",
      icon: <TrendingUp className="h-4 w-4" />,
      trend: "up",
    },
    {
      label: "盈亏比",
      value: "1.82",
      icon: <BarChart3 className="h-4 w-4" />,
      trend: "up",
    },
    {
      label: "最大回撤",
      value: "-6.8%",
      icon: <AlertTriangle className="h-4 w-4" />,
      trend: "down",
    },
    {
      label: "风控拦截率",
      value: "23.4%",
      icon: <Percent className="h-4 w-4" />,
      trend: "neutral",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-lucky-red/20">
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
            {stat.description && (
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
