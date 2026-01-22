"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingDown as Cooldown } from "lucide-react";

interface ThemeItem {
  name: string;
  tier: "MAIN" | "BRANCH" | "FADING";
  strength: number;
  leaders: string[];
}

export function ThemeHeatMap() {
  // Mock data
  const themes: ThemeItem[] = [
    { name: "AI应用", tier: "MAIN", strength: 0.85, leaders: ["300xxx", "002xxx"] },
    { name: "机器人", tier: "MAIN", strength: 0.78, leaders: ["300yyy"] },
    { name: "华为产业链", tier: "BRANCH", strength: 0.62, leaders: ["600xxx"] },
    { name: "CPO光模块", tier: "BRANCH", strength: 0.55, leaders: ["300zzz"] },
    { name: "地产", tier: "FADING", strength: 0.28, leaders: [] },
  ];

  const tierColors: Record<string, string> = {
    MAIN: "bg-stock-up text-white",
    BRANCH: "bg-risk-yellow text-foreground",
    FADING: "bg-muted text-muted-foreground",
  };

  const tierLabels: Record<string, string> = {
    MAIN: "主线",
    BRANCH: "分支",
    FADING: "退潮",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-risk-red" />
          题材热度
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {themes.map((theme) => (
            <div
              key={theme.name}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <Badge className={tierColors[theme.tier]}>
                  {tierLabels[theme.tier]}
                </Badge>
                <div>
                  <p className="font-medium">{theme.name}</p>
                  {theme.leaders.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      龙头: {theme.leaders.join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${theme.strength * 100}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {(theme.strength * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
