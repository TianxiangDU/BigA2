"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Settings, BarChart3, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

interface StrategyGroup {
  group_id: string;
  name: string;
  enabled: boolean;
  strategies: Array<{
    id: string;
    name: string;
    weight: number;
  }>;
  aggregation_method: string;
  runs_today: number;
  blocked_today: number;
  win_rate: number | null;
}

export function StrategyGroupsList() {
  const { data: groups, isLoading } = useQuery<StrategyGroup[]>({
    queryKey: ["strategy", "groups"],
    queryFn: () => api.get<StrategyGroup[]>("/strategy/groups"),
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg">暂无策略组</p>
          <p className="text-sm">通过 MCP 接入策略后创建策略组</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Card
          key={group.group_id}
          className={`border-2 ${
            group.enabled ? "border-primary/50" : "border-border"
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{group.name}</CardTitle>
              <Switch checked={group.enabled} />
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {group.group_id}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Strategies */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">包含策略</p>
              <div className="space-y-2">
                {group.strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{strategy.name}</span>
                    <Badge variant="outline">
                      权重 {(strategy.weight * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              <div className="text-center">
                <p className="text-lg font-bold">{group.runs_today}</p>
                <p className="text-xs text-muted-foreground">今日运行</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: "#dc2626" }}>
                  {group.blocked_today}
                </p>
                <p className="text-xs text-muted-foreground">拦截</p>
              </div>
              <div className="text-center">
                <p
                  className="text-lg font-bold"
                  style={{ color: group.win_rate && group.win_rate >= 0.5 ? "#dc2626" : undefined }}
                >
                  {group.win_rate ? `${(group.win_rate * 100).toFixed(0)}%` : "-"}
                </p>
                <p className="text-xs text-muted-foreground">胜率</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={!group.enabled}
              >
                <Play className="mr-2 h-4 w-4" />
                运行
              </Button>
              <Button size="sm" variant="ghost">
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
