"use client";

import { PageHeader } from "@/components/layout/page-header";
import { RiskLight } from "@/components/dashboard/risk-light";
import { MarketStats } from "@/components/dashboard/market-stats";
import { ThemeHeatMap } from "@/components/dashboard/theme-heat-map";
import { StrategyStats } from "@/components/dashboard/strategy-stats";
import { RecentAlerts } from "@/components/dashboard/recent-alerts";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="概览"
        description="市场状态、策略运行与今日提示汇总"
        actions={
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
        }
      />
      <div className="flex-1 space-y-6 p-6">
        {/* Risk Light & Market Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <RiskLight />
          <MarketStats />
        </div>

        {/* Theme Heat Map */}
        <ThemeHeatMap />

        {/* Strategy Stats & Recent Alerts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <StrategyStats />
          <RecentAlerts />
        </div>
      </div>
    </div>
  );
}
