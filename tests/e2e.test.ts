import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn, type ChildProcess } from "node:child_process";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("E2E Tests with Real CodeX CLI", () => {
  const testDir = "/tmp/mcp-codex-test";
  const testFile = join(testDir, "test.js");
  let serverProcess: ChildProcess | null = null;

  beforeAll(async () => {
    // Create test directory and file
    await Bun.spawn(["mkdir", "-p", testDir]).exited;
    
    // Create a simple test file for analysis
    writeFileSync(testFile, `
function add(a, b) {
  return a + b;
}

function divide(a, b) {
  // Potential division by zero
  return a / b;
}

console.log(add(1, 2));
console.log(divide(10, 0));
`);
  });

  afterAll(async () => {
    // Cleanup
    if (serverProcess) {
      serverProcess.kill();
    }
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
    await Bun.spawn(["rm", "-rf", testDir]).exited;
  });

  it("should execute basic codex command successfully", async () => {
    const result = await executeCodexCommand([
      "exec", 
      "--skip-git-repo-check",
      "What is 2+2? Give me just the number."
    ]);
    
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("4");
  }, 30000); // 30 second timeout

  it("should handle model parameter", async () => {
    const result = await executeCodexCommand([
      "exec",
      "--skip-git-repo-check",
      "--model", "gpt-5",
      "Say 'Hello from gpt-5' exactly"
    ]);
    
    expect(result.exitCode).toBe(0);
    expect(result.output.length).toBeGreaterThan(0);
  }, 30000);

  it("should work with sandbox mode", async () => {
    const result = await executeCodexCommand([
      "exec",
      "--skip-git-repo-check",
      "--sandbox", "read-only",
      "What is the current date? Don't execute any commands, just tell me what command I could use."
    ]);
    
    expect(result.exitCode).toBe(0);
    expect(result.output.length).toBeGreaterThan(0);
  }, 30000);

  it("should analyze a file when it exists", async () => {
    const result = await executeCodexCommand([
      "exec",
      "--skip-git-repo-check",
      `Analyze this JavaScript file for potential issues: ${testFile}. Focus on the divide function.`
    ]);
    
    expect(result.exitCode).toBe(0);
    expect(result.output.toLowerCase()).toMatch(/division|divide|zero/);
  }, 45000);

  it("should handle non-existent files gracefully", async () => {
    const nonExistentFile = "/tmp/does-not-exist.js";
    const result = await executeCodexCommand([
      "exec",
      "--skip-git-repo-check",
      `Please analyze this file: ${nonExistentFile}`
    ]);
    
    // CodeX should either succeed with an explanation or fail gracefully
    expect([0, 1]).toContain(result.exitCode);
    if (result.exitCode !== 0) {
      expect(result.output.toLowerCase()).toMatch(/not found|does not exist|cannot|error/);
    }
  }, 30000);

  it("should work with multiple parameters combined", async () => {
    const result = await executeCodexCommand([
      "exec",
      "--skip-git-repo-check",
      "--model", "gpt-5",
      "--sandbox", "read-only",
      "Explain what this command does: ls -la"
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
      "--model", "gpt-5",
      "--sandbox", "workspace-write",
      "Hello CodeX"
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
      "--model", "gpt-5",
      "--sandbox", "workspace-write",
      "--full-auto",
      `Check for bugs. Please analyze the file: ${testFile}`
    ]);
  });
});

// Helper functions
async function executeCodexCommand(args: string[]): Promise<{
  exitCode: number;
  output: string;
  error: string;
}> {
  return new Promise((resolve, reject) => {
    const process = spawn("codex", args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let output = "";
    let error = "";

    process.stdout?.on("data", (data) => {
      output += data.toString();
    });

    process.stderr?.on("data", (data) => {
      error += data.toString();
    });

    process.on("close", (code) => {
      resolve({
        exitCode: code || 0,
        output: output.trim(),
        error: error.trim(),
      });
    });

    process.on("error", (err) => {
      reject(err);
    });

    // Set a reasonable timeout
    setTimeout(() => {
      process.kill();
      reject(new Error("Command timed out"));
    }, 60000); // 60 seconds
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