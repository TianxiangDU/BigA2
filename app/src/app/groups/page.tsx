"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { StrategyGroupsList } from "@/components/groups/strategy-groups-list";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Play, Layers, Construction } from "lucide-react";
import { toast } from "sonner";

export default function GroupsPage() {
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);

  const handleCreateGroup = () => {
    toast.info("功能开发中", {
      description: "策略组创建功能即将上线，敬请期待",
      icon: <Construction className="h-4 w-4" />,
    });
    setShowNewGroupDialog(false);
  };

  const handleRunAll = () => {
    toast.info("功能开发中", {
      description: "批量运行功能即将上线，敬请期待",
      icon: <Construction className="h-4 w-4" />,
    });
  };

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
            <Button variant="outline" size="sm" onClick={handleRunAll}>
              <Play className="mr-2 h-4 w-4" />
              运行全部
            </Button>
            <Button size="sm" onClick={() => setShowNewGroupDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新建策略组
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        <StrategyGroupsList />
      </div>

      {/* 新建策略组对话框 */}
      <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              新建策略组
            </DialogTitle>
            <DialogDescription>
              将多个策略卡组合成一个策略组，设置聚合方式和冲突规则
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="group-name">策略组名称</Label>
              <Input id="group-name" placeholder="例如：打板主力组" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="group-desc">描述</Label>
              <Textarea
                id="group-desc"
                placeholder="描述策略组的用途和包含的策略..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>聚合方式</Label>
                <Select defaultValue="weighted">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weighted">加权平均</SelectItem>
                    <SelectItem value="voting">多数投票</SelectItem>
                    <SelectItem value="first_match">首个匹配</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>冲突规则</Label>
                <Select defaultValue="any_block">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any_block">任一拦截则拦截</SelectItem>
                    <SelectItem value="majority_block">多数拦截则拦截</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGroupDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateGroup}>
              创建策略组
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
