"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Edit, Play, MoreHorizontal, Copy, Archive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CardStatus = "DRAFT" | "PUBLISHED" | "DEPRECATED";

interface StrategyCard {
  strategyId: string;
  name: string;
  version: string;
  status: CardStatus;
  winRate: number | null;
  trades: number;
  updatedAt: string;
}

const statusStyles: Record<CardStatus, string> = {
  DRAFT: "bg-risk-yellow text-foreground",
  PUBLISHED: "bg-stock-up text-white",
  DEPRECATED: "bg-muted text-muted-foreground",
};

const statusLabels: Record<CardStatus, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  DEPRECATED: "已弃用",
};

export function StrategyCardsList() {
  // Mock data
  const cards: StrategyCard[] = [
    {
      strategyId: "reseal_v1",
      name: "回封策略",
      version: "0.2.0",
      status: "PUBLISHED",
      winRate: 0.625,
      trades: 48,
      updatedAt: "2026-01-21",
    },
    {
      strategyId: "firstseal_guard_v1",
      name: "首封保守策略",
      version: "0.1.2",
      status: "PUBLISHED",
      winRate: 0.583,
      trades: 24,
      updatedAt: "2026-01-19",
    },
    {
      strategyId: "breakout_v1",
      name: "突破追涨策略",
      version: "0.1.0",
      status: "DRAFT",
      winRate: null,
      trades: 0,
      updatedAt: "2026-01-22",
    },
    {
      strategyId: "lowsuck_v1",
      name: "低吸策略",
      version: "0.1.0",
      status: "DEPRECATED",
      winRate: 0.42,
      trades: 12,
      updatedAt: "2026-01-10",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>策略卡列表</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>策略名称</TableHead>
              <TableHead>版本</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-center">胜率</TableHead>
              <TableHead className="text-center">交易次数</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.map((card) => (
              <TableRow key={card.strategyId}>
                <TableCell>
                  <div>
                    <p className="font-medium">{card.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {card.strategyId}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-mono">v{card.version}</TableCell>
                <TableCell>
                  <Badge className={statusStyles[card.status]}>
                    {statusLabels[card.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {card.winRate !== null ? (
                    <span
                      className={
                        card.winRate >= 0.5 ? "text-stock-up" : "text-stock-down"
                      }
                    >
                      {(card.winRate * 100).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">{card.trades}</TableCell>
                <TableCell className="text-muted-foreground">
                  {card.updatedAt}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {card.status === "PUBLISHED" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          复制为新草稿
                        </DropdownMenuItem>
                        <DropdownMenuItem>查看版本历史</DropdownMenuItem>
                        <DropdownMenuItem>策略评估 (Critic)</DropdownMenuItem>
                        {card.status === "PUBLISHED" && (
                          <DropdownMenuItem className="text-destructive">
                            <Archive className="mr-2 h-4 w-4" />
                            弃用
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
