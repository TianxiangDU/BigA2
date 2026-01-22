# Figma MCP 接入指南

## 概述

本项目支持通过 Figma MCP (Model Context Protocol) 接入 Figma 设计稿，实现设计到代码的自动化转换。

## 前置条件

1. Figma 账号及 Personal Access Token
2. 目标 Figma 文件的访问权限
3. MCP 服务端运行环境

## 配置步骤

### 1. 获取 Figma Access Token

1. 登录 [Figma](https://www.figma.com)
2. 进入 Settings → Account → Personal Access Tokens
3. 点击 "Create new token"
4. 保存生成的 token

### 2. 环境变量配置

在项目根目录创建 `.env.local` 文件：

```env
FIGMA_ACCESS_TOKEN=your_figma_access_token_here
FIGMA_FILE_KEY=your_figma_file_key_here
```

### 3. 安装 Figma MCP Server

使用官方 Figma MCP 或配置自定义 MCP Server：

```bash
# 使用 npx 运行官方 Figma MCP (推荐)
npx @anthropic/mcp-figma

# 或者克隆官方实现
git clone https://github.com/anthropics/mcp-figma.git
cd mcp-figma
npm install
npm start
```

### 4. 配置 MCP Client

在你的 AI 工具（如 Claude Desktop、Cursor）中配置 MCP：

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["@anthropic/mcp-figma"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

## 使用场景

### 1. 从 Figma 设计稿生成组件

通过 MCP 获取 Figma 设计稿的组件树，自动生成 shadcn/ui + Tailwind 组件代码。

**工作流程：**

```
Figma 设计稿
    ↓
Figma MCP 读取组件树
    ↓
解析节点属性 (颜色、尺寸、间距、字体)
    ↓
映射到 shadcn 语义 token
    ↓
生成 React 组件代码
```

### 2. 设计稿同步更新

当 Figma 设计稿更新时，可通过 MCP 检测变更并同步更新代码。

### 3. 设计系统验证

验证代码实现是否与 Figma 设计稿一致：

- 颜色值匹配
- 间距一致性
- 字体样式

## API 参考

### Figma MCP 提供的工具

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `get_file` | 获取 Figma 文件信息 | `file_key` |
| `get_file_nodes` | 获取指定节点 | `file_key`, `node_ids` |
| `get_images` | 导出图片资源 | `file_key`, `node_ids`, `format` |
| `get_styles` | 获取样式定义 | `file_key` |
| `get_components` | 获取组件列表 | `file_key` |

### 示例请求

**获取文件结构：**

```json
{
  "tool": "get_file",
  "params": {
    "file_key": "your_file_key"
  }
}
```

**获取特定节点：**

```json
{
  "tool": "get_file_nodes",
  "params": {
    "file_key": "your_file_key",
    "node_ids": ["1:2", "1:5", "1:10"]
  }
}
```

## 设计 Token 映射

### 颜色映射

| Figma 颜色名 | shadcn Token | 用途 |
|--------------|--------------|------|
| `Primary/Red` | `--primary` | 主色调 |
| `Stock/Up` | `--stock-up` | 涨停红 |
| `Stock/Down` | `--stock-down` | 跌停绿 |
| `Background` | `--background` | 背景色 |
| `Muted` | `--muted` | 次级背景 |

### 间距映射

| Figma 间距 | Tailwind 类 |
|------------|-------------|
| 4px | `p-1`, `m-1` |
| 8px | `p-2`, `m-2` |
| 12px | `p-3`, `m-3` |
| 16px | `p-4`, `m-4` |
| 24px | `p-6`, `m-6` |

### 字体映射

| Figma 样式 | Tailwind 类 |
|------------|-------------|
| Heading/H1 | `text-2xl font-bold` |
| Heading/H2 | `text-xl font-semibold` |
| Body/Regular | `text-sm` |
| Body/Small | `text-xs` |
| Mono | `font-mono` |

## 最佳实践

### 1. 保持设计系统一致性

- Figma 中定义好 Design Tokens
- 代码中使用 shadcn 语义 token
- 避免硬编码颜色值

### 2. 组件命名规范

```
Figma: Components/Button/Primary
Code:  components/ui/button.tsx (variant="default")

Figma: Components/Card/Stock
Code:  components/stock/stock-card.tsx
```

### 3. 自动化工作流

可以设置 CI/CD 在 Figma 更新时自动检查设计一致性：

```yaml
# .github/workflows/design-check.yml
name: Design Consistency Check

on:
  schedule:
    - cron: '0 9 * * 1'  # 每周一早上9点

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check Figma consistency
        run: npm run check:figma
        env:
          FIGMA_ACCESS_TOKEN: ${{ secrets.FIGMA_ACCESS_TOKEN }}
```

## 常见问题

### Q: 如何获取 Figma File Key?

打开 Figma 文件，URL 格式为：
```
https://www.figma.com/file/{FILE_KEY}/...
```

`{FILE_KEY}` 就是 File Key。

### Q: 如何获取 Node ID?

1. 在 Figma 中选中目标节点
2. 右键 → "Copy/Paste as" → "Copy link"
3. URL 中 `node-id=` 后面的值就是 Node ID

### Q: MCP 连接失败怎么办?

1. 检查 FIGMA_ACCESS_TOKEN 是否有效
2. 检查网络连接
3. 确认 MCP Server 正在运行
4. 查看 MCP Server 日志

## 参考资源

- [Figma REST API 文档](https://www.figma.com/developers/api)
- [MCP 协议规范](https://modelcontextprotocol.io)
- [shadcn/ui 组件库](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
