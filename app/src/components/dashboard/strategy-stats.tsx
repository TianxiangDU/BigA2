"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

interface StrategyRun {
  strategy_id: string;
  name: string;
  run_count: number;
  block_count: number;
  avg_score: number;
  status: "active" | "paused";
}

export function StrategyStats() {
  const { data: strategies, isLoading } = useQuery<StrategyRun[]>({
    queryKey: ["strategy", "stats"],
    queryFn: () => api.get<StrategyRun[]>("/strategy/stats"),
    staleTime: 30000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          策略组运行统计
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : strategies && strategies.length > 0 ? (
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <div
                key={strategy.strategy_id}
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
                      {strategy.strategy_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">{strategy.run_count}</p>
                    <p className="text-muted-foreground">调用次数</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold" style={{ color: "#dc2626" }}>
                      {strategy.block_count}
                    </p>
                    <p className="text-muted-foreground">拦截次数</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{strategy.avg_score.toFixed(1)}</p>
                    <p className="text-muted-foreground">平均分</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-2 opacity-50" />
            <p>暂无策略运行数据</p>
            <p className="text-sm">添加策略后开始统计</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
