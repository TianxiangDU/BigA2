import { config } from "dotenv";
import { FigmaClient } from "./client.js";
import { ComponentTreeGenerator } from "./component-tree.js";

config();

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

if (!FIGMA_TOKEN) {
  console.error("Error: FIGMA_ACCESS_TOKEN is not set");
  process.exit(1);
}

const client = new FigmaClient(FIGMA_TOKEN);
const treeGenerator = new ComponentTreeGenerator();

/**
 * MCP Tool: get_file
 * 获取 Figma 文件信息
 */
export async function getFile(fileKey: string) {
  try {
    const file = await client.getFile(fileKey);
    return {
      success: true,
      data: {
        name: file.name,
        lastModified: file.lastModified,
        version: file.version,
        pages: file.document.children.map((page: { id: string; name: string; type: string }) => ({
          id: page.id,
          name: page.name,
          type: page.type,
        })),
        components: Object.entries(file.components || {}).map(
          ([id, comp]: [string, unknown]) => ({
            id,
            name: (comp as { name: string }).name,
          })
        ),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "FIGMA_API_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * MCP Tool: get_node
 * 获取指定节点详情
 */
export async function getNode(fileKey: string, nodeId: string) {
  try {
    const node = await client.getNode(fileKey, nodeId);
    const componentTree = treeGenerator.generateTree(node);

    return {
      success: true,
      data: {
        node: {
          id: node.id,
          name: node.name,
          type: node.type,
        },
        componentTree,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "FIGMA_API_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * MCP Tool: get_images
 * 导出节点为图片
 */
export async function getImages(
  fileKey: string,
  nodeIds: string[],
  format: "png" | "jpg" | "svg" | "pdf" = "png",
  scale: number = 2
) {
  try {
    const images = await client.getImages(fileKey, nodeIds, format, scale);
    return {
      success: true,
      data: {
        images,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "FIGMA_API_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

// CLI for testing
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case "get_file": {
      const fileKey = args[1];
      if (!fileKey) {
        console.error("Usage: npm start get_file <file_key>");
        process.exit(1);
      }
      const result = await getFile(fileKey);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "get_node": {
      const fileKey = args[1];
      const nodeId = args[2];
      if (!fileKey || !nodeId) {
        console.error("Usage: npm start get_node <file_key> <node_id>");
        process.exit(1);
      }
      const result = await getNode(fileKey, nodeId);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "get_images": {
      const fileKey = args[1];
      const nodeIds = args[2]?.split(",");
      if (!fileKey || !nodeIds) {
        console.error("Usage: npm start get_images <file_key> <node_id1,node_id2>");
        process.exit(1);
      }
      const result = await getImages(fileKey, nodeIds);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    default:
      console.log("Figma MCP Server ready");
      console.log("Available commands: get_file, get_node, get_images");
  }
}

main().catch(console.error);
