"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

interface StrategyRun {
  strategyId: string;
  name: string;
  runCount: number;
  blockCount: number;
  avgScore: number;
  status: "active" | "paused";
}

export function StrategyStats() {
  // Mock data
  const strategies: StrategyRun[] = [
    {
      strategyId: "reseal_v1",
      name: "回封策略",
      runCount: 156,
      blockCount: 23,
      avgScore: 72.5,
      status: "active",
    },
    {
      strategyId: "firstseal_guard_v1",
      name: "首封保守策略",
      runCount: 89,
      blockCount: 45,
      avgScore: 68.2,
      status: "active",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          策略组运行统计
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {strategies.map((strategy) => (
            <div
              key={strategy.strategyId}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={strategy.status === "active" ? "default" : "secondary"}
                >
                  {strategy.status === "active" ? "运行中" : "已暂停"}
                </Badge>
                <div>
                  <p className="font-medium">{strategy.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {strategy.strategyId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-semibold">{strategy.runCount}</p>
                  <p className="text-muted-foreground">调用次数</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-risk-red">{strategy.blockCount}</p>
                  <p className="text-muted-foreground">拦截次数</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{strategy.avgScore.toFixed(1)}</p>
                  <p className="text-muted-foreground">平均分</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
