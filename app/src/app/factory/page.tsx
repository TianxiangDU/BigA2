"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ContentAssetsList } from "@/components/factory/content-assets-list";
import { StrategyCardsList } from "@/components/factory/strategy-cards-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, FileText, Construction } from "lucide-react";
import { toast } from "sonner";

export default function FactoryPage() {
  const [showNewCardDialog, setShowNewCardDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleCreateCard = () => {
    toast.info("功能开发中", {
      description: "策略卡创建功能即将上线，敬请期待",
      icon: <Construction className="h-4 w-4" />,
    });
    setShowNewCardDialog(false);
  };

  const handleImport = () => {
    toast.info("功能开发中", {
      description: "内容导入功能即将上线，敬请期待",
      icon: <Construction className="h-4 w-4" />,
    });
    setShowImportDialog(false);
  };

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
            <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              导入内容
            </Button>
            <Button size="sm" onClick={() => setShowNewCardDialog(true)}>
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

      {/* 新建策略卡对话框 */}
      <Dialog open={showNewCardDialog} onOpenChange={setShowNewCardDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              新建策略卡
            </DialogTitle>
            <DialogDescription>
              创建一个新的交易策略卡片，定义策略规则和参数
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">策略名称</Label>
              <Input id="name" placeholder="例如：回封策略 v2" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">策略描述</Label>
              <Textarea
                id="description"
                placeholder="描述策略的核心逻辑和适用场景..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">策略类型</Label>
                <Input id="type" placeholder="打板/低吸/追涨" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="version">版本号</Label>
                <Input id="version" placeholder="1.0.0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCardDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateCard}>
              创建策略卡
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导入内容对话框 */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              导入内容资产
            </DialogTitle>
            <DialogDescription>
              支持导入图片、PDF、视频链接等多模态内容
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                拖拽文件到此处，或点击选择文件
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                支持 PNG, JPG, PDF, MP4 (最大 10MB)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              取消
            </Button>
            <Button onClick={handleImport}>
              开始导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
