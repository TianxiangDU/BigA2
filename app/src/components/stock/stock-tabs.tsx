"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface StockTabsProps {
  symbol: string;
}

type TriggerStatus = "PASS" | "FAIL" | "MISSING";

interface Trigger {
  name: string;
  status: TriggerStatus;
  detail: string;
}

const statusIcons: Record<TriggerStatus, React.ReactNode> = {
  PASS: <CheckCircle className="h-4 w-4 text-stock-up" />,
  FAIL: <XCircle className="h-4 w-4 text-risk-red" />,
  MISSING: <AlertCircle className="h-4 w-4 text-risk-yellow" />,
};

export function StockTabs({ symbol }: StockTabsProps) {
  // Mock data
  const triggers: Trigger[] = [
    { name: "回封速度", status: "PASS", detail: "45s <= 60s阈值" },
    { name: "开板次数", status: "PASS", detail: "1次 <= 2次阈值" },
    { name: "成交额", status: "PASS", detail: "5.2亿 >= 3亿阈值" },
    { name: "风险灯", status: "PASS", detail: "YELLOW => 限仓操作" },
    { name: "炸板率", status: "PASS", detail: "18% <= 30%阈值" },
    { name: "题材强度", status: "PASS", detail: "主线题材，强度78%" },
  ];

  const plan = {
    entryNote: "仅在再次回封且成交额不缩量时执行；不追高超预期拉升段",
    exitRules: [
      "开板30s不回封 => 放弃/减仓",
      "pullback_5m > 0.18 => 停止追/撤退",
      "risk_light变RED => 停止新增",
      "尾盘14:30后不新增仓位",
    ],
  };

  const themeInfo = {
    themeName: "AI应用",
    tier: "MAIN",
    leaders: ["300xxx", "002yyy"],
    ladder: [
      { position: "龙头", stocks: ["300xxx"] },
      { position: "二梯队", stocks: ["002yyy", "600zzz"] },
      { position: "三梯队", stocks: ["300aaa", "002bbb"] },
    ],
  };

  const history = [
    { date: "2026-01-21", action: "ALLOW", score: 78.5, result: "成功", pnl: "+3.2%" },
    { date: "2026-01-18", action: "WATCH", score: 62.3, result: "未执行", pnl: "-" },
    { date: "2026-01-15", action: "ALLOW", score: 85.2, result: "失败", pnl: "-2.1%" },
  ];

  return (
    <Tabs defaultValue="triggers" className="flex-1">
      <TabsList>
        <TabsTrigger value="triggers">触发条件</TabsTrigger>
        <TabsTrigger value="plan">执行计划</TabsTrigger>
        <TabsTrigger value="theme">题材梯队</TabsTrigger>
        <TabsTrigger value="history">历史回放</TabsTrigger>
      </TabsList>

      <TabsContent value="triggers" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>触发条件检查</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>条件名称</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead>详情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {triggers.map((trigger) => (
                  <TableRow key={trigger.name}>
                    <TableCell className="font-medium">{trigger.name}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {statusIcons[trigger.status]}
                        <span
                          className={
                            trigger.status === "PASS"
                              ? "text-stock-up"
                              : trigger.status === "FAIL"
                              ? "text-risk-red"
                              : "text-risk-yellow"
                          }
                        >
                          {trigger.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {trigger.detail}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="plan" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>执行计划</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">入场说明</h4>
              <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                {plan.entryNote}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">退出规则</h4>
              <Accordion type="single" collapsible className="w-full">
                {plan.exitRules.map((rule, index) => (
                  <AccordionItem key={index} value={`rule-${index}`}>
                    <AccordionTrigger>规则 {index + 1}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {rule}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="theme" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {themeInfo.themeName}
              <Badge>{themeInfo.tier === "MAIN" ? "主线" : "分支"}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {themeInfo.ladder.map((level) => (
                <div
                  key={level.position}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border"
                >
                  <Badge variant="outline" className="w-20 justify-center">
                    {level.position}
                  </Badge>
                  <div className="flex gap-2 flex-wrap">
                    {level.stocks.map((stock) => (
                      <span
                        key={stock}
                        className="text-sm font-mono text-muted-foreground"
                      >
                        {stock}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>历史回放</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>信号</TableHead>
                  <TableHead className="text-center">分数</TableHead>
                  <TableHead className="text-center">结果</TableHead>
                  <TableHead className="text-right">盈亏</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.date}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.action === "ALLOW" ? "default" : "secondary"}
                      >
                        {item.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{item.score}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          item.result === "成功"
                            ? "default"
                            : item.result === "失败"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {item.result}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        item.pnl.startsWith("+")
                          ? "text-stock-up"
                          : item.pnl.startsWith("-") && item.pnl !== "-"
                          ? "text-stock-down"
                          : ""
                      }`}
                    >
                      {item.pnl}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
