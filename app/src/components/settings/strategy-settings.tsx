"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Save, RotateCcw } from "lucide-react";

interface Strategy {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  weight: number;
  params: Record<string, number | string | boolean>;
}

export function StrategySettings() {
  // Mock data
  const strategies: Strategy[] = [
    {
      id: "reseal_v1",
      name: "回封策略",
      version: "0.1.0",
      enabled: true,
      weight: 0.6,
      params: {
        max_bomb_rate: 0.3,
        reseal_speed_sec: 60,
        min_volume: 300000000,
        min_score: 60,
      },
    },
    {
      id: "firstseal_guard_v1",
      name: "首封保守策略",
      version: "0.1.0",
      enabled: true,
      weight: 0.4,
      params: {
        max_bomb_rate: 0.25,
        max_open_count: 2,
        min_volume: 200000000,
        min_score: 65,
      },
    },
  ];

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
      <Accordion type="multiple" className="space-y-4">
        {strategies.map((strategy) => (
          <AccordionItem
            key={strategy.id}
            value={strategy.id}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Switch checked={strategy.enabled} />
                <div className="text-left">
                  <p className="font-medium">{strategy.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {strategy.id} v{strategy.version}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
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
    </div>
  );
}
