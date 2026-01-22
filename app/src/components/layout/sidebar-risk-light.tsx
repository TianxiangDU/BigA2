"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMarketSentiment } from "@/lib/hooks";

type RiskLevel = "GREEN" | "YELLOW" | "RED";

interface RiskConfig {
  icon: typeof CheckCircle;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const riskConfig: Record<RiskLevel, RiskConfig> = {
  GREEN: {
    icon: CheckCircle,
    label: "绿灯",
    colorClass: "text-risk-green",
    bgClass: "bg-risk-green/10",
    borderClass: "border-risk-green/30",
  },
  YELLOW: {
    icon: AlertTriangle,
    label: "黄灯",
    colorClass: "text-risk-yellow",
    bgClass: "bg-risk-yellow/10",
    borderClass: "border-risk-yellow/30",
  },
  RED: {
    icon: AlertCircle,
    label: "红灯",
    colorClass: "text-stock-up",
    bgClass: "bg-stock-up/10",
    borderClass: "border-stock-up/30",
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

  const triggerContent = (
    <button
      className={cn(
        "w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all duration-200 border",
        "hover:shadow-sm cursor-pointer",
        config.bgClass,
        config.borderClass,
        collapsed ? "justify-center px-2" : ""
      )}
    >
      <div className={cn("flex items-center justify-center rounded-md p-1.5", config.bgClass)}>
        <Icon className={cn("h-4 w-4", config.colorClass)} />
      </div>
      {!collapsed && (
        <span className={cn("text-sm font-semibold", config.colorClass)}>
          {config.label}
        </span>
      )}
    </button>
  );

  const popoverContent = (
    <div className="w-72">
      {/* Header */}
      <div className={cn("flex items-center gap-2.5 p-3 rounded-t-lg", config.bgClass)}>
        <div className={cn("flex items-center justify-center rounded-md p-1.5", config.bgClass)}>
          <Icon className={cn("h-5 w-5", config.colorClass)} />
        </div>
        <div>
          <div className={cn("font-bold", config.colorClass)}>
            风控状态: {config.label}
          </div>
          <div className="text-xs text-muted-foreground">
            {riskData.level === "GREEN" ? "可正常操作" : 
             riskData.level === "YELLOW" ? "谨慎操作" : "禁止/限制操作"}
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="p-3 space-y-2">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          风控规则检测
        </div>
        {riskData.rules.map((rule, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-start gap-2 p-2.5 rounded-lg text-sm",
              rule.met ? "bg-stock-up/10" : "bg-stock-down/10"
            )}
          >
            <span className="mt-0.5">
              {rule.met ? "⚠️" : "✓"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={rule.met ? "text-stock-up" : "text-stock-down"}>
                  {rule.condition}
                </span>
                <span className="font-mono text-xs shrink-0">
                  {rule.value}
                </span>
              </div>
              {rule.met && (
                <div className="text-xs text-stock-up mt-1">
                  → {rule.action}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="px-3 pb-3">
        <div className="flex justify-between text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
          <span>涨停 <strong className="text-foreground">{sentiment?.limit_up_count || 0}</strong></span>
          <span>跌停 <strong className="text-foreground">{sentiment?.limit_down_count || 0}</strong></span>
          <span>炸板率 <strong className="text-foreground">{sentiment?.bomb_rate.toFixed(1) || 0}%</strong></span>
        </div>
      </div>
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>{triggerContent}</PopoverTrigger>
      <PopoverContent side="right" align="start" className="p-0 w-auto">
        {popoverContent}
      </PopoverContent>
    </Popover>
  );
}
