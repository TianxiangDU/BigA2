"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Edit3, Eye, Inbox } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

type ResultLabel = "SUCCESS" | "FAIL" | "SKIP";

interface ReviewItem {
  alert_id: string;
  symbol: string;
  name: string;
  action: "ALLOW" | "WATCH" | "BLOCK";
  score: number;
  timestamp: string;
  label: ResultLabel;
  pnl?: string;
  root_causes?: string[];
  suggestions?: string[];
  summary?: string;
}

const labelStyles: Record<ResultLabel, string> = {
  SUCCESS: "bg-red-500 text-white",
  FAIL: "bg-green-600 text-white",
  SKIP: "bg-muted text-muted-foreground",
};

const labelNames: Record<ResultLabel, string> = {
  SUCCESS: "成功",
  FAIL: "失败",
  SKIP: "未执行",
};

export function ReviewList() {
  const { data: reviews, isLoading } = useQuery<ReviewItem[]>({
    queryKey: ["review", "list"],
    queryFn: () => api.get<ReviewItem[]>("/review/list"),
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Inbox className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg">暂无复盘数据</p>
        <p className="text-sm">执行交易后可在此查看复盘分析</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.alert_id}>
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
                    className="font-mono font-semibold"
                    style={{ color: review.pnl.startsWith("+") ? "#dc2626" : "#16a34a" }}
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
            {(review.root_causes || review.suggestions) && (
              <Accordion type="single" collapsible className="w-full">
                {review.root_causes && review.root_causes.length > 0 && (
                  <AccordionItem value="causes">
                    <AccordionTrigger className="text-sm">
                      归因分析
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1">
                        {review.root_causes.map((cause, index) => (
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
