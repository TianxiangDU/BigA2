"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { PositionList } from "@/components/portfolio/position-list";
import { RiskControl } from "@/components/portfolio/risk-control";

export default function PortfolioPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="仓位"
        description="持仓管理与风控状态"
        breadcrumbs={[
          { label: "首页", href: "/dashboard" },
          { label: "仓位" },
        ]}
      />
      <div className="flex-1 flex flex-col gap-6 p-6 overflow-auto">
        <PortfolioSummary />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PositionList />
          </div>
          <div className="lg:col-span-1">
            <RiskControl />
          </div>
        </div>
      </div>
    </div>
  );
}
