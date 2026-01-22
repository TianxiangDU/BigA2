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
import { ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";

type Action = "ALLOW" | "WATCH" | "BLOCK";

interface StockItem {
  symbol: string;
  name: string;
  tags: string[];
  score: number;
  action: Action;
  confidence: number;
  strategyId: string;
}

const actionStyles: Record<Action, string> = {
  ALLOW: "bg-stock-up text-white",
  WATCH: "bg-risk-yellow text-foreground",
  BLOCK: "bg-risk-red text-white",
};

const actionLabels: Record<Action, string> = {
  ALLOW: "可操作",
  WATCH: "观望",
  BLOCK: "禁止",
};

export function StockPoolTable() {
  // Mock data
  const stocks: StockItem[] = [
    {
      symbol: "300xxx",
      name: "示例股A",
      tags: ["回封", "AI应用"],
      score: 82.4,
      action: "ALLOW",
      confidence: 0.78,
      strategyId: "reseal_v1",
    },
    {
      symbol: "002yyy",
      name: "示例股B",
      tags: ["首封", "机器人"],
      score: 75.2,
      action: "ALLOW",
      confidence: 0.72,
      strategyId: "firstseal_guard_v1",
    },
    {
      symbol: "600zzz",
      name: "示例股C",
      tags: ["回封", "华为产业链"],
      score: 65.8,
      action: "WATCH",
      confidence: 0.65,
      strategyId: "reseal_v1",
    },
    {
      symbol: "300aaa",
      name: "示例股D",
      tags: ["首封", "CPO光模块"],
      score: 58.2,
      action: "WATCH",
      confidence: 0.58,
      strategyId: "firstseal_guard_v1",
    },
    {
      symbol: "002bbb",
      name: "示例股E",
      tags: ["炸板", "地产"],
      score: 42.1,
      action: "BLOCK",
      confidence: 0.42,
      strategyId: "reseal_v1",
    },
  ];

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-24">代码</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>标签</TableHead>
            <TableHead className="text-center">分数</TableHead>
            <TableHead className="text-center">信号</TableHead>
            <TableHead className="text-center">置信度</TableHead>
            <TableHead className="text-center">策略</TableHead>
            <TableHead className="w-24 text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => (
            <TableRow key={stock.symbol} className="hover:bg-accent/50">
              <TableCell className="font-mono">{stock.symbol}</TableCell>
              <TableCell className="font-medium">{stock.name}</TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {stock.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-center font-semibold">
                {stock.score.toFixed(1)}
              </TableCell>
              <TableCell className="text-center">
                <Badge className={actionStyles[stock.action]}>
                  {actionLabels[stock.action]}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {(stock.confidence * 100).toFixed(0)}%
              </TableCell>
              <TableCell className="text-center text-sm text-muted-foreground">
                {stock.strategyId}
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
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
