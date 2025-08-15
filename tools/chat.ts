import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { executeCommand } from "../utils/executeCommand.ts";
import { CODEX_EXEC_SUBCOMMAND, SKIP_GIT_REPO_CHECK_FLAG } from "../constants.ts";

export interface ChatArgs {
  prompt: string;
  model?: string;
  sandbox?: boolean;
  yolo?: boolean;
  reasoningEffort?: "none" | "low" | "medium" | "high";
  reasoningSummary?: "none" | "auto";
}

export async function chatTool(args: ChatArgs): Promise<CallToolResult> {
  const { prompt, model, sandbox = true, yolo = false, reasoningEffort = "medium", reasoningSummary = "none" } = args;

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

    codexArgs.push(prompt);

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
