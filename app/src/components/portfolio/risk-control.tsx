"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Shield, CheckCircle, Inbox } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useMarketSentiment } from "@/lib/hooks";

type RiskLevel = "GREEN" | "YELLOW" | "RED";

interface RiskState {
  riskLight: RiskLevel;
  allowNewTrades: boolean;
  maxTotalPosition: number;
  maxSinglePosition: number;
  notes: string[];
}

function calculateRiskState(sentiment: {
  limit_up_count: number;
  limit_down_count: number;
  bomb_rate: number;
}): RiskState {
  let level: RiskLevel = "GREEN";
  const notes: string[] = [];
  let maxTotal = 0.8;
  let maxSingle = 0.15;
  let allowNew = true;

  // 规则判断
  if (sentiment.limit_up_count < 20) {
    level = "RED";
    allowNew = false;
    notes.push(`涨停数仅${sentiment.limit_up_count}只，市场冷清`);
  }

  if (sentiment.limit_down_count > sentiment.limit_up_count) {
    level = "RED";
    allowNew = false;
    notes.push(`跌停(${sentiment.limit_down_count}) > 涨停(${sentiment.limit_up_count})，市场恐慌`);
  }

  if (sentiment.bomb_rate > 50) {
    level = "RED";
    allowNew = false;
    maxTotal = 0.3;
    maxSingle = 0.05;
    notes.push(`炸板率${sentiment.bomb_rate.toFixed(1)}%过高，禁止追涨停`);
  } else if (sentiment.bomb_rate > 30) {
    if (level === "GREEN") level = "YELLOW";
    maxTotal = 0.5;
    maxSingle = 0.08;
    notes.push(`炸板率${sentiment.bomb_rate.toFixed(1)}%偏高，降低仓位`);
  } else {
    notes.push(`炸板率${sentiment.bomb_rate.toFixed(1)}%处于正常区间`);
  }

  if (notes.length === 0) {
    notes.push("市场状态正常，可正常操作");
  }

  return {
    riskLight: level,
    allowNewTrades: allowNew,
    maxTotalPosition: maxTotal,
    maxSinglePosition: maxSingle,
    notes,
  };
}

const riskLightConfig = {
  GREEN: {
    label: "正常",
    icon: CheckCircle,
    color: "#16a34a",
    bgColor: "rgba(22, 163, 74, 0.1)",
  },
  YELLOW: {
    label: "谨慎",
    icon: AlertTriangle,
    color: "#ca8a04",
    bgColor: "rgba(202, 138, 4, 0.1)",
  },
  RED: {
    label: "禁止",
    icon: Shield,
    color: "#dc2626",
    bgColor: "rgba(220, 38, 38, 0.1)",
  },
};

export function RiskControl() {
  const { data: sentiment, isLoading } = useMarketSentiment();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>风控状态</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!sentiment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>风控状态</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-2 opacity-50" />
          <p>无法获取市场数据</p>
        </CardContent>
      </Card>
    );
  }

  const riskState = calculateRiskState(sentiment);
  const config = riskLightConfig[riskState.riskLight];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle>风控状态</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Light */}
        <div
          className="flex items-center gap-3 p-4 rounded-lg"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          <Icon className="h-8 w-8" />
          <div>
            <p className="font-semibold">{config.label}</p>
            <p className="text-sm opacity-80">当前风险灯状态</p>
          </div>
        </div>

        <Separator />

        {/* Trading Permission */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">允许新交易</span>
            <Badge variant={riskState.allowNewTrades ? "default" : "destructive"}>
              {riskState.allowNewTrades ? "是" : "否"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">总仓位上限</span>
            <span className="font-semibold">
              {(riskState.maxTotalPosition * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">单票仓位上限</span>
            <span className="font-semibold">
              {(riskState.maxSinglePosition * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <Separator />

        {/* Notes */}
        <div className="space-y-2">
          <p className="text-sm font-medium">风控说明</p>
          <ul className="space-y-1">
            {riskState.notes.map((note, index) => (
              <li
                key={index}
                className="text-sm text-muted-foreground flex items-start gap-2"
              >
                <span className="text-muted-foreground">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
