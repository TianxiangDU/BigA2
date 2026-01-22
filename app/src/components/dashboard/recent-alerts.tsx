"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Action = "ALLOW" | "WATCH" | "BLOCK";

interface AlertItem {
  id: string;
  symbol: string;
  name: string;
  action: Action;
  score: number;
  oneLiner: string;
  timestamp: string;
}

const actionStyles: Record<Action, string> = {
  ALLOW: "bg-stock-up text-white",
  WATCH: "bg-risk-yellow text-foreground",
  BLOCK: "bg-risk-red text-white",
};

const actionLabels: Record<Action, string> = {
  ALLOW: "可操作",
  WATCH: "观望",
  BLOCK: "禁止",
};

export function RecentAlerts() {
  // Mock data
  const alerts: AlertItem[] = [
    {
      id: "1",
      symbol: "300xxx",
      name: "示例股A",
      action: "ALLOW",
      score: 82.4,
      oneLiner: "回封速度快，主线题材强势，小仓试错",
      timestamp: "10:35:22",
    },
    {
      id: "2",
      symbol: "002yyy",
      name: "示例股B",
      action: "WATCH",
      score: 65.2,
      oneLiner: "黄灯分歧，等待确认信号",
      timestamp: "10:28:15",
    },
    {
      id: "3",
      symbol: "600zzz",
      name: "示例股C",
      action: "BLOCK",
      score: 42.1,
      oneLiner: "炸板率过高，风险灯红灯",
      timestamp: "10:15:08",
    },
  ];

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
                    {alert.oneLiner}
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
      </CardContent>
    </Card>
  );
}
