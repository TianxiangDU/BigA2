"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerformanceByStrategy } from "@/lib/hooks";

export function StrategyPerformance() {
  const { data: strategies, isLoading } = usePerformanceByStrategy();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>策略表现</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!strategies || strategies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>策略表现</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-2 opacity-50" />
          <p>暂无策略表现数据</p>
        </CardContent>
      </Card>
    );
  }

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
              <TableHead className="text-center">总盈亏</TableHead>
              <TableHead className="text-center">平均盈亏</TableHead>
              <TableHead className="text-center">最大回撤</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {strategies.map((strategy) => (
              <TableRow key={strategy.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{strategy.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {strategy.id}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-center">{strategy.trade_count}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={cn(
                      strategy.win_rate >= 50
                        ? "bg-stock-up text-white"
                        : "bg-stock-down text-white"
                    )}
                  >
                    {strategy.win_rate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-center font-mono",
                    strategy.total_pnl >= 0 ? "text-stock-up" : "text-stock-down"
                  )}
                >
                  {strategy.total_pnl >= 0 ? "+" : ""}
                  {strategy.total_pnl.toFixed(2)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-center font-mono",
                    strategy.avg_pnl >= 0 ? "text-stock-up" : "text-stock-down"
                  )}
                >
                  {strategy.avg_pnl >= 0 ? "+" : ""}
                  {strategy.avg_pnl.toFixed(2)}
                </TableCell>
                <TableCell className="text-center font-mono text-stock-down">
                  -{strategy.max_drawdown.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
