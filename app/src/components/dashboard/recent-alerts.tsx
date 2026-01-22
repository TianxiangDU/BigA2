"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, ChevronRight, Inbox } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

type Action = "ALLOW" | "WATCH" | "BLOCK";

interface AlertItem {
  id: string;
  symbol: string;
  name: string;
  action: Action;
  score: number;
  one_liner: string;
  timestamp: string;
}

const actionStyles: Record<Action, string> = {
  ALLOW: "bg-red-500 text-white",
  WATCH: "bg-yellow-500 text-white",
  BLOCK: "bg-gray-500 text-white",
};

const actionLabels: Record<Action, string> = {
  ALLOW: "可操作",
  WATCH: "观望",
  BLOCK: "禁止",
};

export function RecentAlerts() {
  const { data: alerts, isLoading } = useQuery<AlertItem[]>({
    queryKey: ["alerts", "recent"],
    queryFn: () => api.get<AlertItem[]>("/alerts/recent"),
    staleTime: 30000,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          最近提示
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pool">
            查看全部
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={`/stock/${alert.symbol}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge className={actionStyles[alert.action]}>
                    {actionLabels[alert.action]}
                  </Badge>
                  <div>
                    <p className="font-medium">
                      {alert.name}{" "}
                      <span className="text-muted-foreground">{alert.symbol}</span>
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {alert.one_liner}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{alert.score.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-2 opacity-50" />
            <p>暂无提示信号</p>
            <p className="text-sm">策略运行后将在此显示</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
