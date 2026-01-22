"use client";

import { use } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { StockSummary } from "@/components/stock/stock-summary";
import { StockTabs } from "@/components/stock/stock-tabs";

interface StockDetailPageProps {
  params: Promise<{ symbol: string }>;
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol } = use(params);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`股票详情 - ${symbol}`}
        description="查看策略信号、执行计划与历史回放"
        breadcrumbs={[
          { label: "首页", href: "/dashboard" },
          { label: "股池", href: "/pool" },
          { label: symbol },
        ]}
      />
      <div className="flex-1 flex flex-col gap-6 p-6 overflow-auto">
        <StockSummary symbol={symbol} />
        <StockTabs symbol={symbol} />
      </div>
    </div>
  );
}
