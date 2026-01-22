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

interface GroupStats {
  groupId: string;
  name: string;
  strategies: string[];
  trades: number;
  winRate: number;
  avgReturn: number;
  profitLossRatio: number;
  maxDrawdown: number;
}

export function GroupPerformance() {
  // Mock data
  const groups: GroupStats[] = [
    {
      groupId: "default",
      name: "默认策略组",
      strategies: ["reseal_v1", "firstseal_guard_v1"],
      trades: 72,
      winRate: 0.611,
      avgReturn: 0.031,
      profitLossRatio: 1.85,
      maxDrawdown: -0.068,
    },
    {
      groupId: "aggressive",
      name: "激进策略组",
      strategies: ["reseal_v1"],
      trades: 48,
      winRate: 0.625,
      avgReturn: 0.032,
      profitLossRatio: 1.95,
      maxDrawdown: -0.052,
    },
  ];

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
              <TableHead>包含策略</TableHead>
              <TableHead className="text-center">交易次数</TableHead>
              <TableHead className="text-center">胜率</TableHead>
              <TableHead className="text-center">平均收益</TableHead>
              <TableHead className="text-center">盈亏比</TableHead>
              <TableHead className="text-center">最大回撤</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.groupId}>
                <TableCell>
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {group.groupId}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {group.strategies.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">{group.trades}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={
                      group.winRate >= 0.5
                        ? "bg-stock-up text-white"
                        : "bg-stock-down text-white"
                    }
                  >
                    {(group.winRate * 100).toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-center font-mono ${
                    group.avgReturn >= 0 ? "text-stock-up" : "text-stock-down"
                  }`}
                >
                  {group.avgReturn >= 0 ? "+" : ""}
                  {(group.avgReturn * 100).toFixed(2)}%
                </TableCell>
                <TableCell className="text-center font-mono">
                  {group.profitLossRatio.toFixed(2)}
                </TableCell>
                <TableCell className="text-center font-mono text-stock-down">
                  {(group.maxDrawdown * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
