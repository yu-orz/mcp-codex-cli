import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { existsSync } from "node:fs";
import path from "node:path";
import { executeCommand } from "../utils/executeCommand.ts";
import { CODEX_EXEC_SUBCOMMAND, SKIP_GIT_REPO_CHECK_FLAG } from "../constants.ts";

export interface AnalyzeFileArgs {
  filePath: string;
  prompt?: string;
  model?: string;
  sandbox?: boolean;
  yolo?: boolean;
  reasoningEffort?: "none" | "low" | "medium" | "high";
  reasoningSummary?: "none" | "auto";
}

export async function analyzeFileTool(
  args: AnalyzeFileArgs,
): Promise<CallToolResult> {
  const { filePath, prompt, model, sandbox = true, yolo = false, reasoningEffort = "medium", reasoningSummary = "none" } = args;

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
    const codexArgs = [CODEX_EXEC_SUBCOMMAND, SKIP_GIT_REPO_CHECK_FLAG];

    if (model) {
      codexArgs.push("--model", model);
    }

    if (sandbox) {
      codexArgs.push("--sandbox", "workspace-write");
    }

    if (yolo) {
      codexArgs.push("--full-auto");
    }

    if (reasoningEffort !== "medium") {
      codexArgs.push("-c", `model_reasoning_effort=${reasoningEffort}`);
    }

    if (reasoningSummary !== "none") {
      codexArgs.push("-c", `model_reasoning_summary=${reasoningSummary}`);
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
