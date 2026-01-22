"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Play, MoreHorizontal, Copy, Archive, Inbox } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

type CardStatus = "DRAFT" | "PUBLISHED" | "DEPRECATED";

interface StrategyCard {
  strategy_id: string;
  name: string;
  version: string;
  status: CardStatus;
  win_rate: number | null;
  trades: number;
  updated_at: string;
}

const statusStyles: Record<CardStatus, string> = {
  DRAFT: "bg-yellow-500 text-white",
  PUBLISHED: "bg-red-500 text-white",
  DEPRECATED: "bg-muted text-muted-foreground",
};

const statusLabels: Record<CardStatus, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  DEPRECATED: "已弃用",
};

export function StrategyCardsList() {
  const { data: cards, isLoading } = useQuery<StrategyCard[]>({
    queryKey: ["strategy", "cards"],
    queryFn: () => api.get<StrategyCard[]>("/strategy/cards"),
    staleTime: 30000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>策略卡列表</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : cards && cards.length > 0 ? (
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
                <TableRow key={card.strategy_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{card.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {card.strategy_id}
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
                    {card.win_rate !== null ? (
                      <span style={{ color: card.win_rate >= 0.5 ? "#dc2626" : "#16a34a" }}>
                        {(card.win_rate * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{card.trades}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {card.updated_at}
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
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-2 opacity-50" />
            <p>暂无策略卡</p>
            <p className="text-sm">通过 MCP 接入策略后显示</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
