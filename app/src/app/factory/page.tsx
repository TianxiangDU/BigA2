"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ContentAssetsList } from "@/components/factory/content-assets-list";
import { StrategyCardsList } from "@/components/factory/strategy-cards-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";

export default function FactoryPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="策略工厂"
        description="多模态策略卡创建、编辑与发布"
        breadcrumbs={[
          { label: "首页", href: "/dashboard" },
          { label: "策略工厂" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              导入内容
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              新建策略卡
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        <Tabs defaultValue="cards" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cards">策略卡</TabsTrigger>
            <TabsTrigger value="assets">内容资产</TabsTrigger>
          </TabsList>
          <TabsContent value="cards">
            <StrategyCardsList />
          </TabsContent>
          <TabsContent value="assets">
            <ContentAssetsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
