"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye } from "lucide-react";

type Action = "ALLOW" | "WATCH" | "BLOCK";

interface StockSummaryProps {
  symbol: string;
}

const actionStyles: Record<Action, string> = {
  ALLOW: "bg-stock-up text-white",
  WATCH: "bg-risk-yellow text-foreground",
  BLOCK: "bg-risk-red text-white",
};

export function StockSummary({ symbol }: StockSummaryProps) {
  // Mock data
  const data = {
    name: "示例股票",
    action: "ALLOW" as Action,
    score: 82.4,
    confidence: 0.78,
    oneLiner: "黄灯分歧，满足回封速度与稳定性，小仓试错，开板30秒不回封即撤",
    positionHint: {
      maxSinglePosition: 0.1,
    },
    tags: ["回封", "AI应用", "主线题材"],
  };

  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={actionStyles[data.action]} variant="default">
                {data.action === "ALLOW"
                  ? "可操作"
                  : data.action === "WATCH"
                  ? "观望"
                  : "禁止"}
              </Badge>
              <h2 className="text-xl font-bold">
                {data.name}{" "}
                <span className="text-muted-foreground font-mono">{symbol}</span>
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{data.score.toFixed(1)}分</span>
                <span className="text-muted-foreground">
                  置信度 {(data.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <p className="text-muted-foreground mb-3">{data.oneLiner}</p>
            <div className="flex gap-2 flex-wrap">
              {data.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">建议仓位上限</p>
              <p className="text-2xl font-bold">
                {(data.positionHint.maxSinglePosition * 100).toFixed(0)}%
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1">
                <ShoppingCart className="mr-2 h-4 w-4" />
                模拟买入
              </Button>
              <Button variant="outline">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
