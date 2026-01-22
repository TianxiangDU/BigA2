"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ReviewFilters } from "@/components/review/review-filters";
import { ReviewList } from "@/components/review/review-list";
import { Button } from "@/components/ui/button";
import { Download, Construction } from "lucide-react";
import { toast } from "sonner";

export default function ReviewPage() {
  const handleExport = () => {
    toast.info("功能开发中", {
      description: "导出功能即将上线，敬请期待",
      icon: <Construction className="h-4 w-4" />,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="复盘"
        description="回看提示卡结果、归因分析与参数调整"
        breadcrumbs={[
          { label: "首页", href: "/dashboard" },
          { label: "复盘" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
        }
      />
      <div className="flex-1 flex flex-col gap-4 p-6 overflow-hidden">
        <ReviewFilters />
        <div className="flex-1 overflow-auto">
          <ReviewList />
        </div>
      </div>
    </div>
  );
}
