"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import { usePaperPositions } from "@/lib/hooks";

export function PositionList() {
  const { data: positions, isLoading, error, refetch } = usePaperPositions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>当前持仓</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>当前持仓</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">加载失败</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>当前持仓</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">暂无持仓</p>
        </CardContent>
      </Card>
    );
  }

  const totalValue = positions.reduce(
    (sum, p) => sum + (p.current_price || p.avg_cost) * p.qty,
    0
  );
  const totalPnL = positions.reduce((sum, p) => sum + p.unrealized_pnl, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>当前持仓</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            总市值: ¥{totalValue.toFixed(2)} | 浮盈:
            <span
              className={
                totalPnL >= 0
                  ? "text-[oklch(var(--stock-up))] ml-1"
                  : "text-[oklch(var(--stock-down))] ml-1"
              }
            >
              {totalPnL >= 0 ? "+" : ""}
              {totalPnL.toFixed(2)}
            </span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>代码/名称</TableHead>
              <TableHead className="text-right">持仓</TableHead>
              <TableHead className="text-right">成本</TableHead>
              <TableHead className="text-right">现价</TableHead>
              <TableHead className="text-right">浮盈</TableHead>
              <TableHead className="text-right">盈亏%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((pos) => (
              <TableRow key={pos.symbol}>
                <TableCell>
                  <div>
                    <span className="font-mono">{pos.symbol}</span>
                    <span className="text-muted-foreground ml-2">{pos.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{pos.qty}</TableCell>
                <TableCell className="text-right">{pos.avg_cost.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">
                  {(pos.current_price || pos.avg_cost).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      pos.unrealized_pnl >= 0
                        ? "text-[oklch(var(--stock-up))]"
                        : "text-[oklch(var(--stock-down))]"
                    }
                  >
                    {pos.unrealized_pnl >= 0 ? "+" : ""}
                    {pos.unrealized_pnl.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={pos.pnl_pct >= 0 ? "default" : "destructive"}
                    className={
                      pos.pnl_pct >= 0
                        ? "bg-[oklch(var(--stock-up))]"
                        : "bg-[oklch(var(--stock-down))]"
                    }
                  >
                    {pos.pnl_pct >= 0 ? "+" : ""}
                    {pos.pnl_pct.toFixed(2)}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
