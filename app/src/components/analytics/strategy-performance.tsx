"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StrategyStats {
  strategyId: string;
  name: string;
  trades: number;
  winRate: number;
  avgReturn: number;
  profitLossRatio: number;
  maxDrawdown: number;
  blockedRate: number;
}

export function StrategyPerformance() {
  // Mock data
  const strategies: StrategyStats[] = [
    {
      strategyId: "reseal_v1",
      name: "回封策略",
      trades: 48,
      winRate: 0.625,
      avgReturn: 0.032,
      profitLossRatio: 1.95,
      maxDrawdown: -0.052,
      blockedRate: 0.18,
    },
    {
      strategyId: "firstseal_guard_v1",
      name: "首封保守策略",
      trades: 24,
      winRate: 0.583,
      avgReturn: 0.028,
      profitLossRatio: 1.68,
      maxDrawdown: -0.038,
      blockedRate: 0.32,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>策略表现</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>策略名称</TableHead>
              <TableHead className="text-center">交易次数</TableHead>
              <TableHead className="text-center">胜率</TableHead>
              <TableHead className="text-center">平均收益</TableHead>
              <TableHead className="text-center">盈亏比</TableHead>
              <TableHead className="text-center">最大回撤</TableHead>
              <TableHead className="text-center">拦截率</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {strategies.map((strategy) => (
              <TableRow key={strategy.strategyId}>
                <TableCell>
                  <div>
                    <p className="font-medium">{strategy.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {strategy.strategyId}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-center">{strategy.trades}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={
                      strategy.winRate >= 0.5
                        ? "bg-stock-up text-white"
                        : "bg-stock-down text-white"
                    }
                  >
                    {(strategy.winRate * 100).toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-center font-mono ${
                    strategy.avgReturn >= 0 ? "text-stock-up" : "text-stock-down"
                  }`}
                >
                  {strategy.avgReturn >= 0 ? "+" : ""}
                  {(strategy.avgReturn * 100).toFixed(2)}%
                </TableCell>
                <TableCell className="text-center font-mono">
                  {strategy.profitLossRatio.toFixed(2)}
                </TableCell>
                <TableCell className="text-center font-mono text-stock-down">
                  {(strategy.maxDrawdown * 100).toFixed(1)}%
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {(strategy.blockedRate * 100).toFixed(0)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
