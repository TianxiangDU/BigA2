"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMarketSentiment } from "@/lib/hooks";

type RiskLevel = "GREEN" | "YELLOW" | "RED";

interface RiskConfig {
  icon: typeof CheckCircle;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const riskConfig: Record<RiskLevel, RiskConfig> = {
  GREEN: {
    icon: CheckCircle,
    label: "绿灯",
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.15)",
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  YELLOW: {
    icon: AlertTriangle,
    label: "黄灯",
    color: "#eab308",
    bgColor: "rgba(234, 179, 8, 0.15)",
    borderColor: "rgba(234, 179, 8, 0.4)",
  },
  RED: {
    icon: AlertCircle,
    label: "红灯",
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
};

interface RiskRule {
  condition: string;
  value: string | number;
  met: boolean;
  action: string;
}

function calculateRiskLevel(sentiment: {
  limit_up_count: number;
  limit_down_count: number;
  bomb_rate: number;
  max_streak: number;
}): { level: RiskLevel; rules: RiskRule[] } {
  const rules: RiskRule[] = [];
  let level: RiskLevel = "GREEN";

  // 规则1: 涨停数 < 20
  const lowLimitUp = sentiment.limit_up_count < 20;
  rules.push({
    condition: "涨停数 < 20",
    value: sentiment.limit_up_count,
    met: lowLimitUp,
    action: "市场冷清，禁止新增",
  });

  // 规则2: 跌停数 > 涨停数
  const moreDown = sentiment.limit_down_count > sentiment.limit_up_count;
  rules.push({
    condition: "跌停数 > 涨停数",
    value: `${sentiment.limit_down_count} vs ${sentiment.limit_up_count}`,
    met: moreDown,
    action: "市场恐慌，禁止操作",
  });

  // 规则3: 炸板率 > 30%
  const highBombRate = sentiment.bomb_rate > 30;
  rules.push({
    condition: "炸板率 > 30%",
    value: `${sentiment.bomb_rate.toFixed(1)}%`,
    met: highBombRate,
    action: "仓位 ≤ 50%，单票 ≤ 8%",
  });

  // 规则4: 炸板率 > 50%
  const veryHighBombRate = sentiment.bomb_rate > 50;
  rules.push({
    condition: "炸板率 > 50%",
    value: `${sentiment.bomb_rate.toFixed(1)}%`,
    met: veryHighBombRate,
    action: "禁止追涨停",
  });

  // 综合判断
  if (lowLimitUp || moreDown || veryHighBombRate) {
    level = "RED";
  } else if (highBombRate) {
    level = "YELLOW";
  }

  return { level, rules };
}

export function SidebarRiskLight({ collapsed }: { collapsed: boolean }) {
  const { data: sentiment } = useMarketSentiment();
  const [riskData, setRiskData] = useState<{
    level: RiskLevel;
    rules: RiskRule[];
  }>({ level: "GREEN", rules: [] });

  useEffect(() => {
    if (sentiment) {
      setRiskData(calculateRiskLevel(sentiment));
    }
  }, [sentiment]);

  const config = riskConfig[riskData.level];
  const Icon = config.icon;

  const content = (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors cursor-pointer",
        collapsed ? "justify-center" : ""
      )}
      style={{
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      <Icon className="h-5 w-5 shrink-0" style={{ color: config.color }} />
      {!collapsed && (
        <span className="text-sm font-medium" style={{ color: config.color }}>
          {config.label}
        </span>
      )}
    </div>
  );

  const tooltipContent = (
    <div className="w-72 p-2">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5" style={{ color: config.color }} />
        <span className="font-bold" style={{ color: config.color }}>
          风控状态: {config.label}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="font-medium text-foreground mb-2">判断依据:</div>
        {riskData.rules.map((rule, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-start gap-2 p-2 rounded",
              rule.met ? "bg-red-500/10" : "bg-green-500/10"
            )}
          >
            <span className={rule.met ? "text-red-500" : "text-green-500"}>
              {rule.met ? "⚠️" : "✓"}
            </span>
            <div className="flex-1">
              <div className="flex justify-between">
                <span>{rule.condition}</span>
                <span className="font-mono">{rule.value}</span>
              </div>
              {rule.met && (
                <div className="text-xs text-muted-foreground mt-1">
                  → {rule.action}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>涨停: {sentiment?.limit_up_count || 0}</span>
          <span>跌停: {sentiment?.limit_down_count || 0}</span>
          <span>炸板率: {sentiment?.bomb_rate.toFixed(1) || 0}%</span>
        </div>
      </div>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right" className="p-0">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}
