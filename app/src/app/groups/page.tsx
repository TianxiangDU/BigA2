"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StrategyGroupsList } from "@/components/groups/strategy-groups-list";
import { Button } from "@/components/ui/button";
import { Plus, Play } from "lucide-react";

export default function GroupsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="策略组"
        description="管理策略组合与运行配置"
        breadcrumbs={[
          { label: "首页", href: "/dashboard" },
          { label: "策略组" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Play className="mr-2 h-4 w-4" />
              运行全部
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              新建策略组
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        <StrategyGroupsList />
      </div>
    </div>
  );
}
