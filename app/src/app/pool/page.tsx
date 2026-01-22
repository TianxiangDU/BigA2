"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StockPoolFilters } from "@/components/pool/stock-pool-filters";
import { StockPoolTable } from "@/components/pool/stock-pool-table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Play } from "lucide-react";

export default function PoolPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="股池"
        description="策略推荐候选股票池"
        breadcrumbs={[
          { label: "首页", href: "/dashboard" },
          { label: "股池" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
            <Button size="sm">
              <Play className="mr-2 h-4 w-4" />
              运行策略组
            </Button>
          </div>
        }
      />
      <div className="flex-1 flex flex-col gap-4 p-6 overflow-hidden">
        <StockPoolFilters />
        <div className="flex-1 overflow-auto">
          <StockPoolTable />
        </div>
      </div>
    </div>
  );
}
