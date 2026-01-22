"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function RiskControl() {
  // Mock data
  const riskState = {
    riskLight: "YELLOW" as const,
    allowNewTrades: true,
    maxTotalPosition: 0.6,
    maxSinglePosition: 0.1,
    notes: [
      "黄灯状态，折减仓位",
      "炸板率18%，处于正常区间",
      "无连亏，仓控正常",
    ],
  };

  const riskLightConfig = {
    GREEN: {
      label: "正常",
      icon: CheckCircle,
      className: "text-risk-green bg-risk-green/10",
    },
    YELLOW: {
      label: "谨慎",
      icon: AlertTriangle,
      className: "text-risk-yellow bg-risk-yellow/10",
    },
    RED: {
      label: "禁止",
      icon: Shield,
      className: "text-risk-red bg-risk-red/10",
    },
  };

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
          className={`flex items-center gap-3 p-4 rounded-lg ${config.className}`}
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
