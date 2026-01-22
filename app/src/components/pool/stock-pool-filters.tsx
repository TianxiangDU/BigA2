"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

export function StockPoolFilters() {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索股票代码或名称..."
              className="w-48"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">策略组</Label>
            <Select defaultValue="all">
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部策略</SelectItem>
                <SelectItem value="reseal_v1">回封策略</SelectItem>
                <SelectItem value="firstseal_guard_v1">首封保守</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">题材</Label>
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部题材</SelectItem>
                <SelectItem value="ai">AI应用</SelectItem>
                <SelectItem value="robot">机器人</SelectItem>
                <SelectItem value="huawei">华为产业链</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">信号</Label>
            <Select defaultValue="all">
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="allow">可操作</SelectItem>
                <SelectItem value="watch">观望</SelectItem>
                <SelectItem value="block">禁止</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">分数</Label>
            <Select defaultValue="all">
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="80">≥80分</SelectItem>
                <SelectItem value="60">≥60分</SelectItem>
                <SelectItem value="40">≥40分</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
