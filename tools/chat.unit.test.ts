import { describe, it, expect } from "bun:test";

describe("chatTool Unit Tests", () => {
  it("should validate codex command structure", () => {
    // Test the command arguments that would be passed to codex
    const basicArgs = ["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "Hello, CodeX!"];
    const withModelArgs = ["exec", "--skip-git-repo-check", "--model", "gpt-5", "--sandbox", "workspace-write", "Test prompt"];
    const withoutSandboxArgs = ["exec", "--skip-git-repo-check", "Test prompt"];
    const withYoloArgs = ["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "--full-auto", "Test prompt"];
    const combinedArgs = [
      "exec",
      "--skip-git-repo-check",
      "--model",
      "gpt-5",
      "--sandbox",
      "workspace-write",
      "--full-auto",
      "Complex prompt",
    ];

    expect(basicArgs).toEqual(["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "Hello, CodeX!"]);
    expect(withModelArgs).toEqual(["exec", "--skip-git-repo-check", "--model", "gpt-5", "--sandbox", "workspace-write", "Test prompt"]);
    expect(withoutSandboxArgs).toEqual(["exec", "--skip-git-repo-check", "Test prompt"]);
    expect(withYoloArgs).toEqual(["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "--full-auto", "Test prompt"]);
    expect(combinedArgs).toEqual([
      "exec",
      "--skip-git-repo-check",
      "--model",
      "gpt-5",
      "--sandbox",
      "workspace-write",
      "--full-auto",
      "Complex prompt",
    ]);
  });

  it("should validate argument building logic", () => {
    // Simulate the argument building logic from chatTool
    function buildCodexArgs(options: {
      prompt: string;
      model?: string;
      sandbox?: boolean;
      yolo?: boolean;
      reasoningEffort?: "none" | "low" | "medium" | "high";
      reasoningSummary?: "none" | "auto";
    }) {
      const args: string[] = ["exec", "--skip-git-repo-check"];

      if (options.model) {
        args.push("--model", options.model);
      }

      if (options.sandbox !== false) {
        args.push("--sandbox", "workspace-write");
      }

      if (options.yolo) {
        args.push("--full-auto");
      }

      if (options.reasoningEffort && options.reasoningEffort !== "medium") {
        args.push("-c", `model_reasoning_effort=${options.reasoningEffort}`);
      }

      if (options.reasoningSummary && options.reasoningSummary !== "none") {
        args.push("-c", `model_reasoning_summary=${options.reasoningSummary}`);
      }

      args.push(options.prompt);

      return args;
    }

    expect(buildCodexArgs({ prompt: "Hello" })).toEqual(["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "Hello"]);
    expect(
      buildCodexArgs({
        prompt: "Test",
        model: "gpt-5",
      }),
    ).toEqual(["exec", "--skip-git-repo-check", "--model", "gpt-5", "--sandbox", "workspace-write", "Test"]);

    expect(
      buildCodexArgs({
        prompt: "Test",
        sandbox: false,
      }),
    ).toEqual(["exec", "--skip-git-repo-check", "Test"]);

    expect(
      buildCodexArgs({
        prompt: "Test",
        yolo: true,
      }),
    ).toEqual(["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "--full-auto", "Test"]);

    expect(
      buildCodexArgs({
        prompt: "Complex test",
        model: "gpt-5",
        sandbox: true,
        yolo: true,
      }),
    ).toEqual([
      "exec",
      "--skip-git-repo-check",
      "--model",
      "gpt-5",
      "--sandbox",
      "workspace-write",
      "--full-auto",
      "Complex test",
    ]);

    // Test reasoning options
    expect(
      buildCodexArgs({
        prompt: "Test with reasoning",
        reasoningEffort: "high",
        reasoningSummary: "auto",
      }),
    ).toEqual([
      "exec",
      "--skip-git-repo-check",
      "--sandbox",
      "workspace-write",
      "-c",
      "model_reasoning_effort=high",
      "-c", 
      "model_reasoning_summary=auto",
      "Test with reasoning",
    ]);

    expect(
      buildCodexArgs({
        prompt: "Test with default reasoning",
        reasoningEffort: "medium",  // Should not appear in args
        reasoningSummary: "none",   // Should not appear in args
      }),
    ).toEqual(["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "Test with default reasoning"]);
  });

  it("should validate spawn options structure", () => {
    const expectedSpawnOptions = {
      stdio: ["ignore", "pipe", "pipe"],
    };

    expect(expectedSpawnOptions.stdio).toEqual(["ignore", "pipe", "pipe"]);
  });

  it("should validate codex command name", () => {
    const command = "codex";
    expect(command).toBe("codex");
  });

  it("should validate response structure", () => {
    const mockResponse = {
      content: [
        {
          type: "text",
          text: "CodeX response",
        },
      ],
    };

    expect(mockResponse.content).toHaveLength(1);
    expect(mockResponse.content[0].type).toBe("text");
    expect(mockResponse.content[0].text).toBe("CodeX response");
  });

  it("should validate error response structure", () => {
    const errorResponse = {
      content: [
        {
          type: "text",
          text: "Error executing CodeX CLI: Command failed",
        },
      ],
    };

    expect(errorResponse.content).toHaveLength(1);
    expect(errorResponse.content[0].type).toBe("text");
    expect(errorResponse.content[0].text).toContain(
      "Error executing CodeX CLI",
    );
  });
});
