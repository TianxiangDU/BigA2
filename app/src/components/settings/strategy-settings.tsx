"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Save, RotateCcw, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

interface Strategy {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  weight: number;
  params: Record<string, number | string | boolean>;
}

export function StrategySettings() {
  const { data: strategies, isLoading } = useQuery<Strategy[]>({
    queryKey: ["strategy", "list"],
    queryFn: () => api.get<Strategy[]>("/strategy/list"),
    staleTime: 30000,
  });

  return (
    <div className="space-y-6">
      {/* Strategy Group */}
      <Card>
        <CardHeader>
          <CardTitle>策略组配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">默认策略组</p>
              <p className="text-sm text-muted-foreground">
                聚合方式：加权合成
              </p>
            </div>
            <Badge>激活中</Badge>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>冲突规则</Label>
            <p className="text-sm text-muted-foreground">
              任一策略 BLOCK → 最终 BLOCK；否则有 ALLOW 且 policy gate 允许 →
              ALLOW；否则 WATCH
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Individual Strategies */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : strategies && strategies.length > 0 ? (
        <Accordion type="multiple" className="space-y-4">
          {strategies.map((strategy) => (
            <AccordionItem
              key={strategy.id}
              value={strategy.id}
              className="border rounded-lg px-4"
            >
              <div className="flex items-center gap-3 py-4">
                <Switch
                  checked={strategy.enabled}
                  onClick={(e) => e.stopPropagation()}
                />
                <AccordionTrigger className="hover:no-underline flex-1 py-0">
                  <div className="text-left">
                    <p className="font-medium">{strategy.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {strategy.id} v{strategy.version}
                    </p>
                  </div>
                </AccordionTrigger>
              </div>
              <AccordionContent className="pt-0 pb-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>权重</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      defaultValue={strategy.weight}
                    />
                  </div>
                  {Object.entries(strategy.params).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label>{key}</Label>
                      <Input
                        type={typeof value === "number" ? "number" : "text"}
                        defaultValue={value.toString()}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    重置
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-2 opacity-50" />
            <p>暂无策略</p>
            <p className="text-sm">通过 MCP 接入策略后显示</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
