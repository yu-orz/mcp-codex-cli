import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { existsSync } from "node:fs";
import path from "node:path";
import { executeCommand } from "../utils/executeCommand.ts";

interface AnalyzeFileArgs {
  filePath: string;
  prompt?: string;
  model?: string;
  sandbox?: boolean;
  yolo?: boolean;
}

export async function analyzeFileTool(args: AnalyzeFileArgs): Promise<CallToolResult> {
  const { filePath, prompt, model, sandbox = false, yolo = false } = args;

  // Check if file exists
  if (!existsSync(filePath)) {
    return {
      content: [
        {
          type: "text",
          text: `Error: File not found: ${filePath}`,
        },
      ],
    };
  }

  try {
    const codexArgs = ["exec"];
    
    if (model) {
      codexArgs.push("--model", model);
    }
    
    if (sandbox) {
      codexArgs.push("--sandbox", "workspace-write");
    }
    
    if (yolo) {
      codexArgs.push("--full-auto");
    }

    // Build the prompt with file analysis request
    const analysisPrompt = prompt 
      ? `${prompt}. Please analyze the file: ${path.resolve(filePath)}`
      : `Please analyze this file: ${path.resolve(filePath)}`;

    codexArgs.push(analysisPrompt);

    const result = await executeCommand("codex", codexArgs);
    
    return {
      content: [
        {
          type: "text",
          text: result.stdout || result.stderr,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing CodeX CLI: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}

