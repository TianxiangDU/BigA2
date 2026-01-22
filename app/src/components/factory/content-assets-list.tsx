"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Image, Video, MoreHorizontal, Eye, Inbox, FileIcon, Search, Trash2, Wand2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useContentAssetList, useDeleteContentAsset, useGenerateDraft } from "@/lib/hooks";

type AssetType = "TEXT" | "IMAGE" | "VIDEO_LINK" | "PDF";

const typeIcons: Record<AssetType, React.ReactNode> = {
  TEXT: <FileText className="h-4 w-4" />,
  IMAGE: <Image className="h-4 w-4" />,
  VIDEO_LINK: <Video className="h-4 w-4" />,
  PDF: <FileIcon className="h-4 w-4" />,
};

const typeLabels: Record<AssetType, string> = {
  TEXT: "文本",
  IMAGE: "图片",
  VIDEO_LINK: "视频",
  PDF: "PDF",
};

export function ContentAssetsList() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useContentAssetList({
    page,
    page_size: 20,
    type: typeFilter === "all" ? undefined : typeFilter,
    search: search || undefined,
  });
  
  const deleteMutation = useDeleteContentAsset();
  const generateDraftMutation = useGenerateDraft();
  
  const assets = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);
  
  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("删除成功");
    } catch {
      toast.error("删除失败");
    }
  };
  
  const handleGenerateDraft = async (id: number) => {
    try {
      const result = await generateDraftMutation.mutateAsync({
        assetIds: [id],
        strategyType: "momentum",
      });
      toast.success(`策略草案已生成: ${result.draft.name}`);
    } catch {
      toast.error("生成失败");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>内容资产</CardTitle>
          <div className="text-sm text-muted-foreground">
            共 {total} 条
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 搜索和筛选 */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索标题或内容..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="TEXT">文本</SelectItem>
              <SelectItem value="IMAGE">图片</SelectItem>
              <SelectItem value="VIDEO_LINK">视频</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* 列表 */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : assets.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {typeIcons[asset.type as AssetType]}
                        <Badge variant="outline">{typeLabels[asset.type as AssetType] || asset.type}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asset.title}</p>
                        {asset.raw_text && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {asset.raw_text.slice(0, 50)}...
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(asset.created_at).toLocaleDateString("zh-CN")}
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
                          <DropdownMenuItem onClick={() => handleGenerateDraft(asset.id)}>
                            <Wand2 className="mr-2 h-4 w-4" />
                            生成策略草案
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(asset.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  下一页
                </Button>
              </div>
            )}
          </>
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
