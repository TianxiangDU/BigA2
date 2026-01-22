"use client";

import { PageHeader } from "@/components/layout/page-header";
import { MarketDashboard } from "@/components/dashboard/market-dashboard";
import { ThemeHeatMap } from "@/components/dashboard/theme-heat-map";
import { StrategyStats } from "@/components/dashboard/strategy-stats";
import { RecentAlerts } from "@/components/dashboard/recent-alerts";

export default function DashboardPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="概览"
        description="市场状态、策略运行与今日提示汇总"
      />
      <div className="flex-1 space-y-6 p-6">
        {/* 市场行情看板 - 主要内容 */}
        <MarketDashboard />

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
