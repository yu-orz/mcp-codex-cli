import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("E2E Tests with Real CodeX CLI", () => {
  let testDir: string;
  let testFile: string;

  beforeAll(async () => {
    // Create temporary directory safely
    testDir = await mkdtemp(join(tmpdir(), "mcp-codex-test-"));
    testFile = join(testDir, "test.js");

    // Create a simple test file for analysis
    await writeFile(
      testFile,
      `
function add(a, b) {
  return a + b;
}

function divide(a, b) {
  // Potential division by zero
  return a / b;
}

console.log(add(1, 2));
console.log(divide(10, 0));
`,
    );
  });

  afterAll(async () => {
    // Clean up test directory safely
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors in tests
      console.warn("テストクリーンアップエラー:", error);
    }
  });

  it("should execute basic codex command successfully", async () => {
    const result = await executeCodexCommand([
      "exec",
      "--skip-git-repo-check",
      "What is 2+2? Give me just the number.",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("4");
  }, 30000); // 30 second timeout

  it("should handle model parameter", async () => {
    const result = await executeCodexCommand([
      "exec",
      "--skip-git-repo-check",
      "--model",
      "gpt-5",
      "Say 'Hello from gpt-5' exactly",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.output.length).toBeGreaterThan(0);
  }, 30000);

  it("should work with sandbox mode", async () => {
    const result = await executeCodexCommand([
      "exec",
      "--skip-git-repo-check",
      "--sandbox",
      "read-only",
      "What is the current date? Don't execute any commands, just tell me what command I could use.",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.output.length).toBeGreaterThan(0);
  }, 30000);

  it("should analyze a file when it exists", async () => {
    const result = await executeCodexCommand([
      "exec",
      "--skip-git-repo-check",
      `Analyze this JavaScript file for potential issues: ${testFile}. Focus on the divide function.`,
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.output.toLowerCase()).toMatch(/division|divide|zero/);
  }, 45000);

  it("should handle non-existent files gracefully", async () => {
    const nonExistentFile = join(testDir, "does-not-exist.js");
    const result = await executeCodexCommand([
      "exec",
      "--skip-git-repo-check",
      `Please analyze this file: ${nonExistentFile}`,
    ]);

    // CodeX should either succeed with an explanation or fail gracefully
    expect([0, 1]).toContain(result.exitCode);
    if (result.exitCode !== 0) {
      expect(result.output.toLowerCase()).toMatch(
        /not found|does not exist|cannot|error/,
      );
    }
  }, 30000);

  it("should work with multiple parameters combined", async () => {
    const result = await executeCodexCommand([
      "exec",
      "--skip-git-repo-check",
      "--model",
      "gpt-5",
      "--sandbox",
      "read-only",
      "Explain what this command does: ls -la",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.output.toLowerCase()).toMatch(/list|directory|files/);
  }, 30000);

  it("should handle help command", async () => {
    const result = await executeCodexCommand(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("Codex CLI");
    expect(result.output).toContain("Usage:");
  }, 10000);

  it("should handle version command", async () => {
    const result = await executeCodexCommand(["--version"]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toMatch(/\d+\.\d+\.\d+/); // Version number pattern
  }, 10000);

  // Test our MCP tools indirectly by checking command construction
  it("should validate our chat tool command construction", () => {
    const args = buildChatArgs({
      prompt: "Hello CodeX",
      model: "gpt-5",
      sandbox: true,
    });

    expect(args).toEqual([
      "exec",
      "--skip-git-repo-check",
      "--model",
      "gpt-5",
      "--sandbox",
      "workspace-write",
      "Hello CodeX",
    ]);
  });

  it("should validate our analyzeFile tool command construction", () => {
    const args = buildAnalyzeFileArgs({
      filePath: testFile,
      prompt: "Check for bugs",
      model: "gpt-5",
      sandbox: true,
      yolo: true,
    });

    expect(args).toEqual([
      "exec",
      "--skip-git-repo-check",
      "--model",
      "gpt-5",
      "--sandbox",
      "workspace-write",
      "--full-auto",
      `Check for bugs. Please analyze the file: ${testFile}`,
    ]);
  });
});

// Helper functions
async function executeCodexCommand(args: string[]): Promise<{
  exitCode: number;
  output: string;
}> {
  return new Promise((resolve, reject) => {
    const process = spawn("codex", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    process.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        output: stdout || stderr,
      });
    });

    process.on("error", (error) => {
      reject(error);
    });
  });
}

function buildChatArgs(options: {
  prompt: string;
  model?: string;
  sandbox?: boolean;
  yolo?: boolean;
}): string[] {
  const args = ["exec", "--skip-git-repo-check"];

  if (options.model) {
    args.push("--model", options.model);
  }

  if (options.sandbox) {
    args.push("--sandbox", "workspace-write");
  }

  if (options.yolo) {
    args.push("--full-auto");
  }

  args.push(options.prompt);
  return args;
}

function buildAnalyzeFileArgs(options: {
  filePath: string;
  prompt?: string;
  model?: string;
  sandbox?: boolean;
  yolo?: boolean;
}): string[] {
  const args = ["exec", "--skip-git-repo-check"];

  if (options.model) {
    args.push("--model", options.model);
  }

  if (options.sandbox) {
    args.push("--sandbox", "workspace-write");
  }

  if (options.yolo) {
    args.push("--full-auto");
  }

  const analysisPrompt = options.prompt
    ? `${options.prompt}. Please analyze the file: ${options.filePath}`
    : `Please analyze this file: ${options.filePath}`;

  args.push(analysisPrompt);
  return args;
}