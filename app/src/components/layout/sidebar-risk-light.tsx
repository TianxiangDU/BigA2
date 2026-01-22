"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus, Shield, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useMarketSentiment } from "@/lib/hooks";

type RiskLevel = "GREEN" | "YELLOW" | "RED";
type Regime = "STRONG" | "DIVERGENCE" | "WEAK" | "CHAOS";

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

const regimeConfig: Record<Regime, { label: string; icon: typeof TrendingUp; colorClass: string }> = {
  STRONG: { label: "强势", icon: TrendingUp, colorClass: "text-stock-up" },
  DIVERGENCE: { label: "分化", icon: Minus, colorClass: "text-risk-yellow" },
  WEAK: { label: "弱势", icon: TrendingDown, colorClass: "text-stock-down" },
  CHAOS: { label: "混乱", icon: AlertCircle, colorClass: "text-destructive" },
};

interface RiskRule {
  condition: string;
  value: string | number;
  met: boolean;
  action: string;
  layer: "L0" | "L1" | "L2";
}

interface RiskState {
  level: RiskLevel;
  regime: Regime;
  rules: RiskRule[];
  budget: {
    maxTotalPosition: number;
    maxSinglePosition: number;
    maxNewTrades: number;
  };
  allowNewTrades: boolean;
}

function calculateRiskState(sentiment: {
  limit_up_count: number;
  limit_down_count: number;
  bomb_rate: number;
  max_streak: number;
}): RiskState {
  const rules: RiskRule[] = [];
  let level: RiskLevel = "GREEN";
  let regime: Regime = "DIVERGENCE";
  let allowNewTrades = true;
  
  // 初始预算
  let maxTotal = 0.80;
  let maxSingle = 0.10;
  let maxNew = 5;

  // L0 硬规则
  const lowLimitUp = sentiment.limit_up_count < 20;
  rules.push({
    condition: "涨停数 < 20",
    value: sentiment.limit_up_count,
    met: lowLimitUp,
    action: "禁止新增",
    layer: "L0",
  });

  const moreDown = sentiment.limit_down_count > sentiment.limit_up_count;
  rules.push({
    condition: "跌停数 > 涨停数",
    value: `${sentiment.limit_down_count} vs ${sentiment.limit_up_count}`,
    met: moreDown,
    action: "禁止操作",
    layer: "L0",
  });

  const highBombRate = sentiment.bomb_rate > 45;
  rules.push({
    condition: "炸板率 > 45%",
    value: `${sentiment.bomb_rate.toFixed(1)}%`,
    met: highBombRate,
    action: "禁止新增",
    layer: "L0",
  });

  // L0 硬闸门判断
  if (lowLimitUp || moreDown || highBombRate) {
    level = "RED";
    allowNewTrades = false;
  }

  // L2 Regime 判断
  if (sentiment.limit_up_count >= 80 && sentiment.bomb_rate <= 20) {
    regime = "STRONG";
  } else if (sentiment.limit_down_count >= 50) {
    regime = "CHAOS";
  } else if (sentiment.limit_up_count <= 30) {
    regime = "WEAK";
  } else {
    regime = "DIVERGENCE";
  }

  // L1 风险预算调整
  if (sentiment.bomb_rate > 30) {
    maxTotal *= 0.85;
    maxSingle *= 0.80;
    maxNew -= 1;
    if (level === "GREEN") level = "YELLOW";
    rules.push({
      condition: "炸板率 > 30%",
      value: `${sentiment.bomb_rate.toFixed(1)}%`,
      met: true,
      action: "仓位 ×0.85，单票 ×0.80",
      layer: "L1",
    });
  }

  if (regime === "WEAK") {
    maxTotal *= 0.70;
    maxNew = Math.max(1, maxNew - 2);
    rules.push({
      condition: "弱势市场",
      value: regime,
      met: true,
      action: "仓位 ×0.70，新增 -2",
      layer: "L2",
    });
  } else if (regime === "CHAOS") {
    maxNew = 0;
    rules.push({
      condition: "混乱市场",
      value: regime,
      met: true,
      action: "暂停新增",
      layer: "L2",
    });
  }

  return {
    level,
    regime,
    rules,
    budget: {
      maxTotalPosition: Math.round(maxTotal * 100),
      maxSinglePosition: Math.round(maxSingle * 100),
      maxNewTrades: Math.max(0, maxNew),
    },
    allowNewTrades,
  };
}

export function SidebarRiskLight({ collapsed }: { collapsed: boolean }) {
  const { data: sentiment } = useMarketSentiment();
  const [riskState, setRiskState] = useState<RiskState>({
    level: "GREEN",
    regime: "DIVERGENCE",
    rules: [],
    budget: { maxTotalPosition: 80, maxSinglePosition: 10, maxNewTrades: 5 },
    allowNewTrades: true,
  });

  useEffect(() => {
    if (sentiment) {
      setRiskState(calculateRiskState(sentiment));
    }
  }, [sentiment]);

  const config = riskConfig[riskState.level];
  const regimeConf = regimeConfig[riskState.regime];
  const Icon = config.icon;
  const RegimeIcon = regimeConf.icon;

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
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", config.colorClass)}>
            {config.label}
          </span>
          <Badge variant="outline" className={cn("text-xs px-1.5 py-0", regimeConf.colorClass)}>
            {regimeConf.label}
          </Badge>
        </div>
      )}
    </button>
  );

  const popoverContent = (
    <div className="w-80">
      {/* Header */}
      <div className={cn("flex items-center justify-between p-3 rounded-t-lg", config.bgClass)}>
        <div className="flex items-center gap-2.5">
          <div className={cn("flex items-center justify-center rounded-md p-1.5", config.bgClass)}>
            <Icon className={cn("h-5 w-5", config.colorClass)} />
          </div>
          <div>
            <div className={cn("font-bold", config.colorClass)}>
              {config.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {riskState.allowNewTrades ? "可操作" : "禁止新增"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/50">
          <RegimeIcon className={cn("h-4 w-4", regimeConf.colorClass)} />
          <span className={cn("text-sm font-medium", regimeConf.colorClass)}>
            {regimeConf.label}
          </span>
        </div>
      </div>

      {/* Risk Budget */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
          <Shield className="h-3.5 w-3.5" />
          风险预算 (L1)
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold">{riskState.budget.maxTotalPosition}%</div>
            <div className="text-xs text-muted-foreground">最大仓位</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold">{riskState.budget.maxSinglePosition}%</div>
            <div className="text-xs text-muted-foreground">单票上限</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className={cn("text-lg font-bold", riskState.budget.maxNewTrades === 0 && "text-stock-up")}>
              {riskState.budget.maxNewTrades}
            </div>
            <div className="text-xs text-muted-foreground">可新增</div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
          <Activity className="h-3.5 w-3.5" />
          触发规则
        </div>
        {riskState.rules.filter(r => r.met).length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            暂无触发规则 ✓
          </div>
        ) : (
          riskState.rules.filter(r => r.met).map((rule, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-start gap-2 p-2.5 rounded-lg text-sm",
                rule.layer === "L0" ? "bg-stock-up/10" : 
                rule.layer === "L1" ? "bg-risk-yellow/10" : "bg-muted/50"
              )}
            >
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs px-1 py-0 shrink-0",
                  rule.layer === "L0" ? "border-stock-up text-stock-up" :
                  rule.layer === "L1" ? "border-risk-yellow text-risk-yellow" : "border-muted-foreground"
                )}
              >
                {rule.layer}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{rule.condition}</span>
                  <span className="font-mono text-xs shrink-0 text-muted-foreground">
                    {rule.value}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  → {rule.action}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Separator />

      {/* Footer Stats */}
      <div className="p-3">
        <div className="flex justify-between text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
          <span>涨停 <strong className="text-stock-up">{sentiment?.limit_up_count || 0}</strong></span>
          <span>跌停 <strong className="text-stock-down">{sentiment?.limit_down_count || 0}</strong></span>
          <span>炸板率 <strong className={sentiment?.bomb_rate && sentiment.bomb_rate > 30 ? "text-risk-yellow" : "text-foreground"}>
            {sentiment?.bomb_rate?.toFixed(1) || 0}%
          </strong></span>
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
