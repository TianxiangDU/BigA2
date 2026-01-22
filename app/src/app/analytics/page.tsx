"use client";

import { PageHeader } from "@/components/layout/page-header";
import { AnalyticsSummary } from "@/components/analytics/analytics-summary";
import { StrategyPerformance } from "@/components/analytics/strategy-performance";
import { GroupPerformance } from "@/components/analytics/group-performance";
import { RiskStats } from "@/components/analytics/risk-stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Shield } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="统计分析"
        description="策略与策略组的表现评估"
        breadcrumbs={[
          { label: "首页", href: "/dashboard" },
          { label: "统计分析" },
        ]}
        actions={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            导出报告
          </Button>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
          <AnalyticsSummary />
          <Tabs defaultValue="strategy" className="space-y-6">
            <TabsList>
              <TabsTrigger value="strategy">按策略</TabsTrigger>
              <TabsTrigger value="group">按策略组</TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                风控效果
              </TabsTrigger>
              <TabsTrigger value="regime">按市场状态</TabsTrigger>
              <TabsTrigger value="theme">按题材</TabsTrigger>
            </TabsList>
            <TabsContent value="strategy">
              <StrategyPerformance />
            </TabsContent>
            <TabsContent value="group">
              <GroupPerformance />
            </TabsContent>
            <TabsContent value="risk">
              <RiskStats />
            </TabsContent>
            <TabsContent value="regime">
              <div className="text-center text-muted-foreground py-12">
                按市场状态分析（开发中...）
              </div>
            </TabsContent>
            <TabsContent value="theme">
              <div className="text-center text-muted-foreground py-12">
                按题材分析（开发中...）
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
