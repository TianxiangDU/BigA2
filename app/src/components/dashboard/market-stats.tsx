"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Zap, Layers } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p
            className={`text-xs ${
              trend === "up"
                ? "text-stock-up"
                : trend === "down"
                ? "text-stock-down"
                : "text-muted-foreground"
            }`}
          >
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function MarketStats() {
  // Mock data - 实际从 API 获取
  const stats = {
    limitUpCount: 68,
    limitDownCount: 12,
    bombRate: 0.18,
    maxStreak: 5,
  };

  return (
    <>
      <StatCard
        title="涨停数"
        value={stats.limitUpCount}
        description="较昨日 +12"
        icon={<TrendingUp className="h-4 w-4" />}
        trend="up"
      />
      <StatCard
        title="跌停数"
        value={stats.limitDownCount}
        description="较昨日 -3"
        icon={<TrendingDown className="h-4 w-4" />}
        trend="down"
      />
      <StatCard
        title="炸板率"
        value={`${(stats.bombRate * 100).toFixed(1)}%`}
        description="处于正常区间"
        icon={<Zap className="h-4 w-4" />}
        trend="neutral"
      />
    </>
  );
}
