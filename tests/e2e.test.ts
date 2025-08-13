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
    console.log("🧪 テスト開始: 基本的なCodeXコマンド実行");
    
    const result = await executeCodexCommand([
      "exec",
      "--skip-git-repo-check",
      "What is 2+2? Give me just the number.",
    ]);

    console.log(`🔍 結果: 終了コード=${result.exitCode}, 出力長=${result.output.length}`);
    console.log(`📝 出力内容: ${result.output.substring(0, 500)}...`);

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("4");
    
    console.log("✅ テスト成功: 基本的なCodeXコマンド実行");
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

  it("should validate reasoning options in command construction", () => {
    const chatArgs = buildChatArgs({
      prompt: "Test reasoning",
      reasoningEffort: "high",
      reasoningSummary: "auto",
    });

    expect(chatArgs).toEqual([
      "exec",
      "--skip-git-repo-check",
      "-c",
      "model_reasoning_effort=high",
      "-c",
      "model_reasoning_summary=auto",
      "Test reasoning",
    ]);

    const analyzeArgs = buildAnalyzeFileArgs({
      filePath: testFile,
      reasoningEffort: "low",
      reasoningSummary: "auto",
    });

    expect(analyzeArgs).toEqual([
      "exec",
      "--skip-git-repo-check",
      "-c",
      "model_reasoning_effort=low",
      "-c",
      "model_reasoning_summary=auto",
      `Please analyze this file: ${testFile}`,
    ]);
  });
});

// Helper functions
async function executeCodexCommand(args: string[]): Promise<{
  exitCode: number;
  output: string;
}> {
  console.log(`🔧 実行中: codex ${args.join(' ')}`);
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const process = spawn("codex", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    process.stdout?.on("data", (data) => {
      const chunk = data.toString();
      stdout += chunk;
      console.log(`📤 STDOUT: ${chunk.trim()}`);
    });

    process.stderr?.on("data", (data) => {
      const chunk = data.toString();
      stderr += chunk;
      console.log(`📤 STDERR: ${chunk.trim()}`);
    });

    process.on("close", (code) => {
      const duration = Date.now() - startTime;
      console.log(`✅ コマンド終了: 終了コード=${code}, 実行時間=${duration}ms`);
      console.log(`📋 STDOUT合計: ${stdout.length}文字`);
      console.log(`📋 STDERR合計: ${stderr.length}文字`);
      
      resolve({
        exitCode: code ?? 1,
        output: stdout || stderr,
      });
    });

    process.on("error", (error) => {
      const duration = Date.now() - startTime;
      console.log(`❌ プロセスエラー: ${error.message}, 実行時間=${duration}ms`);
      reject(error);
    });
  });
}

function buildChatArgs(options: {
  prompt: string;
  model?: string;
  sandbox?: boolean;
  yolo?: boolean;
  reasoningEffort?: "none" | "low" | "medium" | "high";
  reasoningSummary?: "none" | "auto";
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

  if (options.reasoningEffort && options.reasoningEffort !== "medium") {
    args.push("-c", `model_reasoning_effort=${options.reasoningEffort}`);
  }

  if (options.reasoningSummary && options.reasoningSummary !== "none") {
    args.push("-c", `model_reasoning_summary=${options.reasoningSummary}`);
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
  reasoningEffort?: "none" | "low" | "medium" | "high";
  reasoningSummary?: "none" | "auto";
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

  if (options.reasoningEffort && options.reasoningEffort !== "medium") {
    args.push("-c", `model_reasoning_effort=${options.reasoningEffort}`);
  }

  if (options.reasoningSummary && options.reasoningSummary !== "none") {
    args.push("-c", `model_reasoning_summary=${options.reasoningSummary}`);
  }

  const analysisPrompt = options.prompt
    ? `${options.prompt}. Please analyze the file: ${options.filePath}`
    : `Please analyze this file: ${options.filePath}`;

  args.push(analysisPrompt);
  return args;
}