"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type RiskLevel = "GREEN" | "YELLOW" | "RED";

const riskConfig: Record<RiskLevel, { icon: typeof CheckCircle; label: string; className: string }> = {
  GREEN: {
    icon: CheckCircle,
    label: "正常",
    className: "text-risk-green bg-risk-green/10 border-risk-green/30",
  },
  YELLOW: {
    icon: AlertTriangle,
    label: "谨慎",
    className: "text-risk-yellow bg-risk-yellow/10 border-risk-yellow/30",
  },
  RED: {
    icon: AlertCircle,
    label: "禁止",
    className: "text-risk-red bg-risk-red/10 border-risk-red/30",
  },
};

export function RiskLight() {
  // Mock data - 实际从 API 获取
  const riskLevel: RiskLevel = "YELLOW";
  const config = riskConfig[riskLevel];
  const Icon = config.icon;

  return (
    <Card className={cn("border-2", config.className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          风险灯
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Icon className="h-10 w-10" />
          <div>
            <p className="text-2xl font-bold">{config.label}</p>
            <p className="text-sm text-muted-foreground">当前市场状态</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
