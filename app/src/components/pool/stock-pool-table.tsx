"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useLimitUpStocks } from "@/lib/hooks";

export function StockPoolTable() {
  const { data: stocks, isLoading, error, refetch } = useLimitUpStocks();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground mb-4">加载失败，请检查后端服务</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
      </div>
    );
  }

  if (!stocks || stocks.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">暂无涨停股数据</p>
        <p className="text-sm text-muted-foreground mt-2">
          请确保后端服务已启动且当前为交易时间
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-sm text-muted-foreground">
          共 {stocks.length} 只涨停股
        </span>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          刷新
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-24">代码</TableHead>
            <TableHead>名称</TableHead>
            <TableHead className="text-right">现价</TableHead>
            <TableHead className="text-right">涨幅</TableHead>
            <TableHead className="text-right">成交额(万)</TableHead>
            <TableHead className="text-right">换手率</TableHead>
            <TableHead className="w-16 text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.slice(0, 20).map((stock) => (
            <TableRow key={stock.symbol} className="hover:bg-accent/50">
              <TableCell className="font-mono">{stock.symbol}</TableCell>
              <TableCell className="font-medium">{stock.name}</TableCell>
              <TableCell className="text-right font-semibold" style={{ color: "#dc2626" }}>
                {stock.price.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Badge style={{ backgroundColor: "#dc2626", color: "white" }}>
                  +{stock.change_pct.toFixed(2)}%
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {(stock.amount / 10000).toFixed(0)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {stock.volume > 0
                  ? ((stock.amount / stock.volume / 100) * 100).toFixed(2)
                  : "--"}
                %
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/stock/${stock.symbol}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
