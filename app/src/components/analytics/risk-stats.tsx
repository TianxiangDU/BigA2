"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  CheckCircle,
  Ban,
  ArrowDownCircle,
  Inbox
} from "lucide-react";
import { useRiskStats } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface RiskStatsProps {
  startDate?: string;
  endDate?: string;
  groupId?: string;
}

export function RiskStats({ startDate, endDate, groupId }: RiskStatsProps) {
  const { data, isLoading } = useRiskStats({ startDate, endDate, groupId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.total_decisions === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-2 opacity-50" />
          <p>暂无风控决策记录</p>
          <p className="text-sm">运行策略组后开始统计</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 概览卡片 */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总决策数
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_decisions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              L0 拦截数
            </CardTitle>
            <Ban className="h-4 w-4 text-stock-up" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-stock-up">{data.hard_gate_blocked}</div>
            <p className="text-xs text-muted-foreground">
              拦截率 {data.hard_gate_block_rate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              L3 降级数
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-risk-yellow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-risk-yellow">{data.adjustments_downgrade}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              L3 屏蔽数
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-stock-up" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-stock-up">{data.adjustments_block}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              调整率
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              data.adjustment_rate > 30 ? "text-stock-up" : 
              data.adjustment_rate > 10 ? "text-risk-yellow" : "text-stock-down"
            )}>
              {data.adjustment_rate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              通过率
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-stock-down" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-stock-down">
              {(100 - data.hard_gate_block_rate - data.adjustment_rate).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细分析 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 按原因分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">拦截原因分布</CardTitle>
          </CardHeader>
          <CardContent>
            {data.by_reason.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无拦截</p>
            ) : (
              <div className="space-y-2">
                {data.by_reason.map((item) => (
                  <div key={item.reason} className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {formatReason(item.reason)}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-stock-up rounded-full"
                          style={{ width: `${item.rate}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {item.count} ({item.rate.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 按 Regime 分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">市场状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.by_regime.map((item) => (
                <div key={item.regime} className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      item.regime === "STRONG" && "border-stock-up text-stock-up",
                      item.regime === "DIVERGENCE" && "border-risk-yellow text-risk-yellow",
                      item.regime === "WEAK" && "border-stock-down text-stock-down",
                      item.regime === "CHAOS" && "border-destructive text-destructive"
                    )}
                  >
                    {formatRegime(item.regime)}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          item.regime === "STRONG" && "bg-stock-up",
                          item.regime === "DIVERGENCE" && "bg-risk-yellow",
                          item.regime === "WEAK" && "bg-stock-down",
                          item.regime === "CHAOS" && "bg-destructive"
                        )}
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {item.count} ({item.rate.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 按 Risk Light 分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">风控灯分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.by_risk_light.map((item) => (
                <div key={item.risk_light} className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      item.risk_light === "GREEN" && "border-risk-green text-risk-green",
                      item.risk_light === "YELLOW" && "border-risk-yellow text-risk-yellow",
                      item.risk_light === "RED" && "border-stock-up text-stock-up"
                    )}
                  >
                    {item.risk_light === "GREEN" ? "绿灯" : 
                     item.risk_light === "YELLOW" ? "黄灯" : "红灯"}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          item.risk_light === "GREEN" && "bg-risk-green",
                          item.risk_light === "YELLOW" && "bg-risk-yellow",
                          item.risk_light === "RED" && "bg-stock-up"
                        )}
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {item.count} ({item.rate.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatReason(reason: string): string {
  const map: Record<string, string> = {
    DATA_DEGRADED: "数据降级",
    DATA_LAG: "数据延迟",
    MARKET_RED: "市场红灯",
    HIGH_BOMB_RATE: "高炸板率",
    HIGH_DOWN_LIMIT: "高跌停数",
    ACCOUNT_DRAWDOWN: "账户回撤",
    ACCOUNT_LOSS_STREAK: "连续亏损",
    UNKNOWN: "未知",
  };
  return map[reason] || reason;
}

function formatRegime(regime: string): string {
  const map: Record<string, string> = {
    STRONG: "强势",
    DIVERGENCE: "分化",
    WEAK: "弱势",
    CHAOS: "混乱",
  };
  return map[regime] || regime;
}
