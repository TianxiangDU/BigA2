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
import { usePerformanceByGroup } from "@/lib/hooks";

export function GroupPerformance() {
  const { data: groups, isLoading } = usePerformanceByGroup();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>策略组表现</CardTitle>
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

  if (!groups || groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>策略组表现</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-2 opacity-50" />
          <p>暂无策略组表现数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>策略组表现</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>策略组</TableHead>
              <TableHead className="text-center">交易次数</TableHead>
              <TableHead className="text-center">胜率</TableHead>
              <TableHead className="text-center">总盈亏</TableHead>
              <TableHead className="text-center">平均盈亏</TableHead>
              <TableHead className="text-center">最大回撤</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {group.id}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-center">{group.trade_count}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={cn(
                      group.win_rate >= 50
                        ? "bg-stock-up text-white"
                        : "bg-stock-down text-white"
                    )}
                  >
                    {group.win_rate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-center font-mono",
                    group.total_pnl >= 0 ? "text-stock-up" : "text-stock-down"
                  )}
                >
                  {group.total_pnl >= 0 ? "+" : ""}
                  {group.total_pnl.toFixed(2)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-center font-mono",
                    group.avg_pnl >= 0 ? "text-stock-up" : "text-stock-down"
                  )}
                >
                  {group.avg_pnl >= 0 ? "+" : ""}
                  {group.avg_pnl.toFixed(2)}
                </TableCell>
                <TableCell className="text-center font-mono text-stock-down">
                  -{group.max_drawdown.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
