"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Play, Settings, BarChart3, Shield } from "lucide-react";

interface StrategyGroup {
  groupId: string;
  name: string;
  enabled: boolean;
  strategies: Array<{
    id: string;
    name: string;
    weight: number;
  }>;
  aggregationMethod: string;
  runsToday: number;
  blockedToday: number;
  winRate: number | null;
}

export function StrategyGroupsList() {
  // Mock data
  const groups: StrategyGroup[] = [
    {
      groupId: "default",
      name: "默认策略组",
      enabled: true,
      strategies: [
        { id: "reseal_v1", name: "回封策略", weight: 0.6 },
        { id: "firstseal_guard_v1", name: "首封保守策略", weight: 0.4 },
      ],
      aggregationMethod: "加权合成",
      runsToday: 156,
      blockedToday: 23,
      winRate: 0.611,
    },
    {
      groupId: "aggressive",
      name: "激进策略组",
      enabled: false,
      strategies: [{ id: "reseal_v1", name: "回封策略", weight: 1.0 }],
      aggregationMethod: "加权合成",
      runsToday: 0,
      blockedToday: 0,
      winRate: 0.625,
    },
    {
      groupId: "conservative",
      name: "保守策略组",
      enabled: false,
      strategies: [
        { id: "firstseal_guard_v1", name: "首封保守策略", weight: 1.0 },
      ],
      aggregationMethod: "加权合成",
      runsToday: 0,
      blockedToday: 0,
      winRate: 0.583,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Card
          key={group.groupId}
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
              {group.groupId}
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
                <p className="text-lg font-bold">{group.runsToday}</p>
                <p className="text-xs text-muted-foreground">今日运行</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-risk-red">
                  {group.blockedToday}
                </p>
                <p className="text-xs text-muted-foreground">拦截</p>
              </div>
              <div className="text-center">
                <p
                  className={`text-lg font-bold ${
                    group.winRate && group.winRate >= 0.5
                      ? "text-stock-up"
                      : "text-muted-foreground"
                  }`}
                >
                  {group.winRate ? `${(group.winRate * 100).toFixed(0)}%` : "-"}
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
