import type { FigmaNode, FigmaFill } from "./client.js";

/**
 * 组件树节点
 */
interface ComponentTreeNode {
  type: string;
  name: string;
  tokens: Record<string, string>;
  children?: ComponentTreeNode[];
  content?: string;
}

/**
 * Figma 到 Tailwind/shadcn Token 映射
 */
const colorToToken = (color: { r: number; g: number; b: number; a?: number }): string => {
  const { r, g, b, a = 1 } = color;
  
  // 将 0-1 范围转换为 0-255
  const r255 = Math.round(r * 255);
  const g255 = Math.round(g * 255);
  const b255 = Math.round(b * 255);

  // 简单的颜色匹配规则
  // 白色
  if (r255 > 250 && g255 > 250 && b255 > 250) {
    return "bg-background";
  }
  // 黑色
  if (r255 < 30 && g255 < 30 && b255 < 30) {
    return "bg-foreground";
  }
  // 灰色 - card
  if (r255 > 240 && g255 > 240 && b255 > 240) {
    return "bg-card";
  }
  // 灰色 - muted
  if (r255 > 200 && g255 > 200 && b255 > 200) {
    return "bg-muted";
  }

  // 默认返回自定义颜色
  return `bg-[rgb(${r255},${g255},${b255})]`;
};

const radiusToToken = (radius: number | undefined): string => {
  if (!radius || radius === 0) return "";
  if (radius <= 2) return "rounded-sm";
  if (radius <= 4) return "rounded";
  if (radius <= 6) return "rounded-md";
  if (radius <= 8) return "rounded-lg";
  if (radius <= 12) return "rounded-xl";
  if (radius <= 16) return "rounded-2xl";
  return "rounded-3xl";
};

const spacingToToken = (value: number | undefined, prefix: string): string => {
  if (!value || value === 0) return "";
  if (value <= 2) return `${prefix}-0.5`;
  if (value <= 4) return `${prefix}-1`;
  if (value <= 8) return `${prefix}-2`;
  if (value <= 12) return `${prefix}-3`;
  if (value <= 16) return `${prefix}-4`;
  if (value <= 20) return `${prefix}-5`;
  if (value <= 24) return `${prefix}-6`;
  if (value <= 32) return `${prefix}-8`;
  return `${prefix}-[${value}px]`;
};

const fontSizeToToken = (size: number | undefined): string => {
  if (!size) return "";
  if (size <= 12) return "text-xs";
  if (size <= 14) return "text-sm";
  if (size <= 16) return "text-base";
  if (size <= 18) return "text-lg";
  if (size <= 20) return "text-xl";
  if (size <= 24) return "text-2xl";
  if (size <= 30) return "text-3xl";
  return "text-4xl";
};

const fontWeightToToken = (weight: number | undefined): string => {
  if (!weight) return "";
  if (weight <= 300) return "font-light";
  if (weight <= 400) return "font-normal";
  if (weight <= 500) return "font-medium";
  if (weight <= 600) return "font-semibold";
  if (weight <= 700) return "font-bold";
  return "font-extrabold";
};

/**
 * 组件树生成器
 */
export class ComponentTreeGenerator {
  /**
   * 生成组件树
   */
  generateTree(node: FigmaNode): ComponentTreeNode {
    return this.processNode(node);
  }

  private processNode(node: FigmaNode): ComponentTreeNode {
    const tokens: Record<string, string> = {};

    // 处理背景色
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === "SOLID" && fill.color) {
        tokens.background = colorToToken(fill.color);
      }
    }

    // 处理圆角
    const radiusToken = radiusToToken(node.cornerRadius);
    if (radiusToken) {
      tokens.borderRadius = radiusToken;
    }

    // 处理边框
    if (node.strokes && node.strokes.length > 0) {
      tokens.border = "border border-border";
    }

    // 处理内边距
    const paddingTokens: string[] = [];
    if (node.paddingTop && node.paddingBottom && node.paddingTop === node.paddingBottom) {
      paddingTokens.push(spacingToToken(node.paddingTop, "py"));
    } else {
      if (node.paddingTop) paddingTokens.push(spacingToToken(node.paddingTop, "pt"));
      if (node.paddingBottom) paddingTokens.push(spacingToToken(node.paddingBottom, "pb"));
    }
    if (node.paddingLeft && node.paddingRight && node.paddingLeft === node.paddingRight) {
      paddingTokens.push(spacingToToken(node.paddingLeft, "px"));
    } else {
      if (node.paddingLeft) paddingTokens.push(spacingToToken(node.paddingLeft, "pl"));
      if (node.paddingRight) paddingTokens.push(spacingToToken(node.paddingRight, "pr"));
    }
    if (paddingTokens.length > 0) {
      tokens.padding = paddingTokens.filter(Boolean).join(" ");
    }

    // 处理布局
    if (node.layoutMode === "HORIZONTAL") {
      tokens.layout = "flex flex-row";
      if (node.itemSpacing) {
        tokens.layout += ` ${spacingToToken(node.itemSpacing, "gap")}`;
      }
    } else if (node.layoutMode === "VERTICAL") {
      tokens.layout = "flex flex-col";
      if (node.itemSpacing) {
        tokens.layout += ` ${spacingToToken(node.itemSpacing, "gap")}`;
      }
    }

    // 处理对齐
    if (node.primaryAxisAlignItems) {
      switch (node.primaryAxisAlignItems) {
        case "CENTER":
          tokens.justify = "justify-center";
          break;
        case "SPACE_BETWEEN":
          tokens.justify = "justify-between";
          break;
        case "MAX":
          tokens.justify = "justify-end";
          break;
      }
    }
    if (node.counterAxisAlignItems) {
      switch (node.counterAxisAlignItems) {
        case "CENTER":
          tokens.align = "items-center";
          break;
        case "MAX":
          tokens.align = "items-end";
          break;
      }
    }

    // 处理文本样式
    if (node.type === "TEXT" && node.style) {
      tokens.fontSize = fontSizeToToken(node.style.fontSize);
      tokens.fontWeight = fontWeightToToken(node.style.fontWeight);
      tokens.color = "text-foreground"; // 默认
    }

    // 构建结果
    const result: ComponentTreeNode = {
      type: this.mapNodeType(node.type),
      name: node.name,
      tokens: Object.fromEntries(
        Object.entries(tokens).filter(([_, v]) => v)
      ),
    };

    // 处理文本内容
    if (node.type === "TEXT" && node.characters) {
      result.content = node.characters;
    }

    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      result.children = node.children.map((child) => this.processNode(child));
    }

    return result;
  }

  private mapNodeType(figmaType: string): string {
    const typeMap: Record<string, string> = {
      FRAME: "div",
      GROUP: "div",
      COMPONENT: "Component",
      INSTANCE: "Component",
      TEXT: "Text",
      RECTANGLE: "div",
      ELLIPSE: "div",
      LINE: "hr",
      VECTOR: "svg",
    };
    return typeMap[figmaType] || "div";
  }
}
