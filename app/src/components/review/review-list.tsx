"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Edit3, Eye } from "lucide-react";
import Link from "next/link";

type ResultLabel = "SUCCESS" | "FAIL" | "SKIP";

interface ReviewItem {
  alertId: string;
  symbol: string;
  name: string;
  action: "ALLOW" | "WATCH" | "BLOCK";
  score: number;
  timestamp: string;
  label: ResultLabel;
  pnl?: string;
  rootCauses?: string[];
  suggestions?: string[];
  summary?: string;
}

const labelStyles: Record<ResultLabel, string> = {
  SUCCESS: "bg-stock-up text-white",
  FAIL: "bg-stock-down text-white",
  SKIP: "bg-muted text-muted-foreground",
};

const labelNames: Record<ResultLabel, string> = {
  SUCCESS: "成功",
  FAIL: "失败",
  SKIP: "未执行",
};

export function ReviewList() {
  // Mock data
  const reviews: ReviewItem[] = [
    {
      alertId: "a_20260122_001",
      symbol: "300xxx",
      name: "示例股A",
      action: "ALLOW",
      score: 82.4,
      timestamp: "10:35:22",
      label: "SUCCESS",
      pnl: "+3.2%",
      rootCauses: ["主线题材持续强势", "回封速度优秀"],
      suggestions: ["当前参数合适，无需调整"],
      summary: "策略判断准确，主线题材配合回封速度达标",
    },
    {
      alertId: "a_20260122_002",
      symbol: "002yyy",
      name: "示例股B",
      action: "ALLOW",
      score: 75.2,
      timestamp: "10:28:15",
      label: "FAIL",
      pnl: "-2.1%",
      rootCauses: ["环境恶化", "炸板率从18%升至35%"],
      suggestions: [
        "YELLOW灯且bomb_rate>0.30时，将max_single_position下调到0.06",
        "回封速度阈值从60s收紧到45s（仅在强势日执行）",
      ],
      summary: "环境恶化导致失败，策略阈值可在分歧日收紧",
    },
    {
      alertId: "a_20260122_003",
      symbol: "600zzz",
      name: "示例股C",
      action: "WATCH",
      score: 65.8,
      timestamp: "10:15:08",
      label: "SKIP",
      summary: "观望信号，未执行操作",
    },
  ];

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.alertId}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={labelStyles[review.label]}>
                  {labelNames[review.label]}
                </Badge>
                <CardTitle className="text-base">
                  {review.name}{" "}
                  <span className="text-muted-foreground font-mono text-sm">
                    {review.symbol}
                  </span>
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {review.timestamp}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {review.pnl && (
                  <span
                    className={`font-mono font-semibold ${
                      review.pnl.startsWith("+")
                        ? "text-stock-up"
                        : "text-stock-down"
                    }`}
                  >
                    {review.pnl}
                  </span>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/stock/${review.symbol}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {review.summary && (
              <p className="text-muted-foreground mb-3">{review.summary}</p>
            )}
            {(review.rootCauses || review.suggestions) && (
              <Accordion type="single" collapsible className="w-full">
                {review.rootCauses && review.rootCauses.length > 0 && (
                  <AccordionItem value="causes">
                    <AccordionTrigger className="text-sm">
                      归因分析
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1">
                        {review.rootCauses.map((cause, index) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span>•</span>
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {review.suggestions && review.suggestions.length > 0 && (
                  <AccordionItem value="suggestions">
                    <AccordionTrigger className="text-sm">
                      参数建议
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1">
                        {review.suggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span>•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
