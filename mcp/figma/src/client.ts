/**
 * Figma API Client
 * 封装 Figma REST API 调用
 */

interface FigmaFile {
  name: string;
  lastModified: string;
  version: string;
  document: {
    children: FigmaNode[];
  };
  components: Record<string, { name: string }>;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  layoutMode?: "HORIZONTAL" | "VERTICAL" | "NONE";
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  characters?: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    lineHeight?: number;
  };
}

interface FigmaFill {
  type: string;
  color?: {
    r: number;
    g: number;
    b: number;
    a?: number;
  };
}

interface FigmaStroke {
  type: string;
  color?: {
    r: number;
    g: number;
    b: number;
    a?: number;
  };
}

export class FigmaClient {
  private baseUrl = "https://api.figma.com/v1";
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "X-Figma-Token": this.token,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 获取文件信息
   */
  async getFile(fileKey: string): Promise<FigmaFile> {
    return this.request<FigmaFile>(`/files/${fileKey}`);
  }

  /**
   * 获取节点信息
   */
  async getNode(fileKey: string, nodeId: string): Promise<FigmaNode> {
    const response = await this.request<{ nodes: Record<string, { document: FigmaNode }> }>(
      `/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`
    );
    const nodeData = response.nodes[nodeId];
    if (!nodeData) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    return nodeData.document;
  }

  /**
   * 导出节点为图片
   */
  async getImages(
    fileKey: string,
    nodeIds: string[],
    format: "png" | "jpg" | "svg" | "pdf" = "png",
    scale: number = 2
  ): Promise<Record<string, string>> {
    const ids = nodeIds.join(",");
    const response = await this.request<{ images: Record<string, string> }>(
      `/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=${format}&scale=${scale}`
    );
    return response.images;
  }
}

export type { FigmaFile, FigmaNode, FigmaFill, FigmaStroke };
