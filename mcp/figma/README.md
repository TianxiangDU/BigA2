# Figma MCP Server

Figma MCP Server 为 AI Agent 提供来自 Figma 文件/节点的上下文，帮助更准确地实现设计还原。

## 功能

- `figma.get_file`: 获取 Figma 文件信息
- `figma.get_node`: 获取指定节点详情
- `figma.get_images`: 导出节点为图片

## 安装

```bash
cd mcp/figma
npm install
```

## 配置

复制 `.env.example` 为 `.env` 并填入你的 Figma Access Token：

```bash
cp .env.example .env
```

编辑 `.env`:

```
FIGMA_ACCESS_TOKEN=your_figma_access_token_here
```

### 获取 Figma Access Token

1. 登录 Figma
2. 进入 Settings -> Account -> Personal access tokens
3. 生成新的 Token

## 启动

```bash
npm start
```

## 工具说明

### get_file

获取 Figma 文件的基本信息和结构。

**参数：**
- `file_key`: Figma 文件 Key (从 URL 获取)

**返回：**
- 文件名、最后修改时间
- 页面列表
- 组件列表

### get_node

获取指定节点的详细信息。

**参数：**
- `file_key`: Figma 文件 Key
- `node_id`: 节点 ID

**返回：**
- 节点类型、名称
- 布局属性（位置、尺寸、padding 等）
- 样式属性（颜色、圆角、阴影等）
- 子节点列表
- 组件树 JSON（用于生成 shadcn 代码）

### get_images

导出节点为图片。

**参数：**
- `file_key`: Figma 文件 Key
- `node_ids`: 节点 ID 数组
- `format`: 图片格式 (png/jpg/svg/pdf)
- `scale`: 缩放比例

**返回：**
- 节点 ID 到图片 URL 的映射

## Token 对齐规则

Figma 属性会自动映射到 shadcn/Tailwind token：

| Figma 属性 | shadcn/Tailwind Token |
|-----------|----------------------|
| 背景色 | bg-background / bg-card / bg-primary 等 |
| 文字色 | text-foreground / text-muted-foreground 等 |
| 边框色 | border-border |
| 圆角 | rounded-sm / rounded-md / rounded-lg 等 |
| 间距 | p-2 / p-4 / gap-2 等 |

## 组件树 JSON 格式

```json
{
  "type": "Frame",
  "name": "Card",
  "tokens": {
    "background": "bg-card",
    "border": "border-border rounded-lg",
    "padding": "p-4"
  },
  "children": [
    {
      "type": "Text",
      "name": "Title",
      "tokens": {
        "color": "text-foreground",
        "font": "text-lg font-semibold"
      },
      "content": "Card Title"
    }
  ]
}
```
