"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MinusCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Position {
  symbol: string;
  name: string;
  quantity: number;
  costPrice: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPercent: number;
  positionRatio: number;
}

export function PositionList() {
  // Mock data
  const positions: Position[] = [
    {
      symbol: "300xxx",
      name: "示例股A",
      quantity: 2000,
      costPrice: 24.5,
      currentPrice: 25.8,
      marketValue: 51600,
      pnl: 2600,
      pnlPercent: 5.31,
      positionRatio: 0.15,
    },
    {
      symbol: "002yyy",
      name: "示例股B",
      quantity: 1500,
      costPrice: 18.0,
      currentPrice: 17.5,
      marketValue: 26250,
      pnl: -750,
      pnlPercent: -2.78,
      positionRatio: 0.08,
    },
    {
      symbol: "600zzz",
      name: "示例股C",
      quantity: 3000,
      costPrice: 32.0,
      currentPrice: 33.2,
      marketValue: 99600,
      pnl: 3600,
      pnlPercent: 3.75,
      positionRatio: 0.25,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>持仓列表</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>股票</TableHead>
              <TableHead className="text-right">数量</TableHead>
              <TableHead className="text-right">成本价</TableHead>
              <TableHead className="text-right">现价</TableHead>
              <TableHead className="text-right">市值</TableHead>
              <TableHead className="text-right">盈亏</TableHead>
              <TableHead className="text-center">占比</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position) => (
              <TableRow key={position.symbol}>
                <TableCell>
                  <div>
                    <p className="font-medium">{position.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {position.symbol}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right">{position.quantity}</TableCell>
                <TableCell className="text-right font-mono">
                  {position.costPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {position.currentPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ¥{position.marketValue.toLocaleString()}
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${
                    position.pnl >= 0 ? "text-stock-up" : "text-stock-down"
                  }`}
                >
                  <div>
                    <p>
                      {position.pnl >= 0 ? "+" : ""}¥{position.pnl.toLocaleString()}
                    </p>
                    <p className="text-xs">
                      {position.pnlPercent >= 0 ? "+" : ""}
                      {position.pnlPercent.toFixed(2)}%
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">
                    {(position.positionRatio * 100).toFixed(0)}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-stock-down"
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/stock/${position.symbol}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
