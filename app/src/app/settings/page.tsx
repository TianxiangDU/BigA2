"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StrategySettings } from "@/components/settings/strategy-settings";
import { DataSourceSettings } from "@/components/settings/data-source-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="设置"
        description="策略组配置、数据源与密钥管理"
        breadcrumbs={[
          { label: "首页", href: "/dashboard" },
          { label: "设置" },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto">
        <Tabs defaultValue="strategy" className="space-y-6">
          <TabsList>
            <TabsTrigger value="strategy">策略组</TabsTrigger>
            <TabsTrigger value="datasource">数据源</TabsTrigger>
          </TabsList>
          <TabsContent value="strategy">
            <StrategySettings />
          </TabsContent>
          <TabsContent value="datasource">
            <DataSourceSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
