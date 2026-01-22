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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";

interface Order {
  id: string;
  symbol: string;
  name: string;
  direction: "buy" | "sell";
  price: number;
  quantity: number;
  status: "pending" | "filled" | "cancelled";
  timestamp: string;
  alertId?: string;
}

export function PaperOrderHistory() {
  // Mock data
  const orders: Order[] = [
    {
      id: "1",
      symbol: "300xxx",
      name: "示例股A",
      direction: "buy",
      price: 25.5,
      quantity: 1000,
      status: "filled",
      timestamp: "10:35:22",
      alertId: "alert-1",
    },
    {
      id: "2",
      symbol: "002yyy",
      name: "示例股B",
      direction: "buy",
      price: 18.2,
      quantity: 500,
      status: "pending",
      timestamp: "10:42:15",
    },
    {
      id: "3",
      symbol: "600zzz",
      name: "示例股C",
      direction: "sell",
      price: 32.8,
      quantity: 800,
      status: "cancelled",
      timestamp: "09:58:30",
    },
  ];

  const statusLabels: Record<string, string> = {
    pending: "待成交",
    filled: "已成交",
    cancelled: "已撤单",
  };

  const statusStyles: Record<string, string> = {
    pending: "bg-risk-yellow text-foreground",
    filled: "bg-stock-up text-white",
    cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>订单记录</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="pending">待成交</TabsTrigger>
            <TabsTrigger value="filled">已成交</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>股票</TableHead>
                  <TableHead className="text-center">方向</TableHead>
                  <TableHead className="text-right">价格</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-muted-foreground">
                      {order.timestamp}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {order.symbol}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={order.direction === "buy" ? "default" : "secondary"}
                        className={
                          order.direction === "buy"
                            ? "bg-stock-up"
                            : "bg-stock-down text-white"
                        }
                      >
                        {order.direction === "buy" ? "买入" : "卖出"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {order.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{order.quantity}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={statusStyles[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {order.status === "pending" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="pending">
            <p className="text-center text-muted-foreground py-8">
              筛选待成交订单...
            </p>
          </TabsContent>
          <TabsContent value="filled">
            <p className="text-center text-muted-foreground py-8">
              筛选已成交订单...
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
