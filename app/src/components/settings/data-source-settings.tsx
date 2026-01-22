"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface DataSource {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  latencyMs?: number;
}

export function DataSourceSettings() {
  const [showApiKey, setShowApiKey] = useState(false);

  // Mock data
  const dataSources: DataSource[] = [
    {
      id: "adata",
      name: "AData 行情数据",
      status: "connected",
      lastSync: "2026-01-22 10:35:22",
      latencyMs: 45,
    },
    {
      id: "tushare",
      name: "Tushare 基础数据",
      status: "connected",
      lastSync: "2026-01-22 09:30:00",
      latencyMs: 120,
    },
  ];

  const statusConfig = {
    connected: {
      label: "已连接",
      icon: CheckCircle,
      className: "text-stock-up bg-stock-up/10",
    },
    disconnected: {
      label: "未连接",
      icon: AlertCircle,
      className: "text-muted-foreground bg-muted",
    },
    error: {
      label: "错误",
      icon: AlertCircle,
      className: "text-risk-red bg-risk-red/10",
    },
  };

  return (
    <div className="space-y-6">
      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle>数据源状态</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dataSources.map((source) => {
            const config = statusConfig[source.status];
            const Icon = config.icon;
            return (
              <div
                key={source.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.className}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{source.name}</p>
                    {source.lastSync && (
                      <p className="text-sm text-muted-foreground">
                        最后同步: {source.lastSync}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {source.latencyMs && (
                    <span className="text-sm text-muted-foreground">
                      延迟: {source.latencyMs}ms
                    </span>
                  )}
                  <Badge className={config.className}>{config.label}</Badge>
                  <Button variant="ghost" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API 密钥</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>AData API Key</Label>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? "text" : "password"}
                placeholder="输入 API Key"
                defaultValue="sk-xxxxxxxxxxxxxxxx"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Tushare Token</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="输入 Token"
                defaultValue="xxxxxxxxxxxxxxxx"
              />
              <Button variant="outline" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="pt-2">
            <Button>保存密钥</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
