#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Command } from "commander";
import { chatTool } from "./tools/chat.ts";
import { analyzeFileTool } from "./tools/analyzeFile.ts";

const server = new Server(
  {
    name: "mcp-codex-cli",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツールの定義
const tools: Tool[] = [
  {
    name: "chat",
    description: "Engage in a chat conversation with CodeX CLI",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The prompt to send to CodeX CLI",
        },
        model: {
          type: "string",
          description: "The model to use (optional, default: gpt-5)",
        },
        sandbox: {
          type: "boolean",
          description: "Run in sandbox mode (optional)",
        },
        yolo: {
          type: "boolean",
          description: "Automatically accept all actions (optional)",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "analyzeFile",
    description: "Analyze a file using CodeX CLI",
    inputSchema: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Path to the file to analyze",
        },
        prompt: {
          type: "string",
          description: "Optional prompt for analysis",
        },
        model: {
          type: "string",
          description: "The model to use (optional, default: gpt-5)",
        },
        sandbox: {
          type: "boolean",
          description: "Run in sandbox mode (optional)",
        },
        yolo: {
          type: "boolean",
          description: "Automatically accept all actions (optional)",
        },
      },
      required: ["filePath"],
    },
  },
];

// ツール一覧の処理
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// ツール呼び出しの処理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "chat":
        return await chatTool(args);
      case "analyzeFile":
        return await analyzeFileTool(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
});

// CLI設定
const program = new Command();
program
  .name("mcp-codex-cli")
  .description("MCP server for CodeX CLI")
  .version("0.1.0")
  .option("--allow-npx", "Allow execution from NPX")
  .parse();

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CodeX CLI MCP server started");
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("Server startup error:", error);
    process.exit(1);
  });
}