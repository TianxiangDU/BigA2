"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PaperTradingStats } from "@/components/paper/paper-trading-stats";
import { PaperOrderForm } from "@/components/paper/paper-order-form";
import { PaperOrderHistory } from "@/components/paper/paper-order-history";

export default function PaperTradingPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="模拟盘"
        description="按提示卡执行买卖并记录"
        breadcrumbs={[
          { label: "首页", href: "/dashboard" },
          { label: "模拟盘" },
        ]}
      />
      <div className="flex-1 flex flex-col gap-6 p-6 overflow-auto">
        <PaperTradingStats />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <PaperOrderForm />
          </div>
          <div className="lg:col-span-2">
            <PaperOrderHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
