"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, MinusCircle } from "lucide-react";

export function PaperOrderForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>下单</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>股票代码</Label>
          <Input placeholder="输入股票代码" />
        </div>
        <div className="space-y-2">
          <Label>方向</Label>
          <Select defaultValue="buy">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">买入</SelectItem>
              <SelectItem value="sell">卖出</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>价格</Label>
          <Input type="number" placeholder="输入价格" step="0.01" />
        </div>
        <div className="space-y-2">
          <Label>数量（股）</Label>
          <Input type="number" placeholder="输入数量" step="100" />
        </div>
        <div className="space-y-2">
          <Label>关联提示卡（可选）</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="选择提示卡" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alert-1">300xxx - 回封策略</SelectItem>
              <SelectItem value="alert-2">002yyy - 首封策略</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 pt-2">
          <Button className="flex-1 bg-stock-up hover:bg-stock-up/90">
            <ShoppingCart className="mr-2 h-4 w-4" />
            买入
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-stock-down border-stock-down hover:bg-stock-down/10"
          >
            <MinusCircle className="mr-2 h-4 w-4" />
            卖出
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
