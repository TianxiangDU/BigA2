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
import { FileText, Image, Video, MoreHorizontal, Eye, Inbox } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

type AssetType = "TEXT" | "IMAGE" | "VIDEO_LINK";

interface ContentAsset {
  id: string;
  type: AssetType;
  title: string;
  created_at: string;
  linked_strategies: number;
}

const typeIcons: Record<AssetType, React.ReactNode> = {
  TEXT: <FileText className="h-4 w-4" />,
  IMAGE: <Image className="h-4 w-4" />,
  VIDEO_LINK: <Video className="h-4 w-4" />,
};

const typeLabels: Record<AssetType, string> = {
  TEXT: "文本",
  IMAGE: "图片",
  VIDEO_LINK: "视频",
};

export function ContentAssetsList() {
  const { data: assets, isLoading } = useQuery<ContentAsset[]>({
    queryKey: ["content", "assets"],
    queryFn: () => api.get<ContentAsset[]>("/content/assets"),
    staleTime: 30000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>内容资产</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : assets && assets.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>类型</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-center">关联策略</TableHead>
                <TableHead className="text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {typeIcons[asset.type]}
                      <Badge variant="outline">{typeLabels[asset.type]}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{asset.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.created_at}
                  </TableCell>
                  <TableCell className="text-center">
                    {asset.linked_strategies > 0 ? (
                      <Badge>{asset.linked_strategies}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          查看
                        </DropdownMenuItem>
                        <DropdownMenuItem>编辑</DropdownMenuItem>
                        <DropdownMenuItem>生成策略草案</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-2 opacity-50" />
            <p>暂无内容资产</p>
            <p className="text-sm">上传内容后可生成策略草案</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
