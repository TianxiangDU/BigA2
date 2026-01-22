"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Image, Video, MoreHorizontal, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AssetType = "TEXT" | "IMAGE" | "VIDEO_LINK";

interface ContentAsset {
  id: string;
  type: AssetType;
  title: string;
  createdAt: string;
  linkedStrategies: number;
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
  // Mock data
  const assets: ContentAsset[] = [
    {
      id: "1",
      type: "TEXT",
      title: "回封策略要点总结",
      createdAt: "2026-01-20",
      linkedStrategies: 2,
    },
    {
      id: "2",
      type: "VIDEO_LINK",
      title: "打板技术视频笔记 - 涨停板回封操作",
      createdAt: "2026-01-18",
      linkedStrategies: 1,
    },
    {
      id: "3",
      type: "IMAGE",
      title: "分时图案例截图",
      createdAt: "2026-01-15",
      linkedStrategies: 0,
    },
    {
      id: "4",
      type: "TEXT",
      title: "首封保守策略规则",
      createdAt: "2026-01-12",
      linkedStrategies: 1,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>内容资产</CardTitle>
      </CardHeader>
      <CardContent>
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
                  {asset.createdAt}
                </TableCell>
                <TableCell className="text-center">
                  {asset.linkedStrategies > 0 ? (
                    <Badge>{asset.linkedStrategies}</Badge>
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
      </CardContent>
    </Card>
  );
}
