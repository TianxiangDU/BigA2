"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

interface ThemeItem {
  name: string;
  tier: "MAIN" | "BRANCH" | "FADING";
  strength: number;
  leaders: string[];
}

const tierColors: Record<string, string> = {
  MAIN: "bg-red-500 text-white",
  BRANCH: "bg-yellow-500 text-white",
  FADING: "bg-muted text-muted-foreground",
};

const tierLabels: Record<string, string> = {
  MAIN: "主线",
  BRANCH: "分支",
  FADING: "退潮",
};

export function ThemeHeatMap() {
  const { data: themes, isLoading } = useQuery<ThemeItem[]>({
    queryKey: ["market", "themes"],
    queryFn: () => api.get<ThemeItem[]>("/market/themes"),
    staleTime: 60000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5" style={{ color: "#dc2626" }} />
          题材热度
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : themes && themes.length > 0 ? (
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
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-2 opacity-50" />
            <p>暂无题材数据</p>
            <p className="text-sm">接入题材分析后显示</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
