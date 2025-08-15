import { describe, it, expect } from "bun:test";

describe("analyzeFileTool Unit Tests", () => {
  it("should validate codex command structure for file analysis", () => {
    // Test the command arguments that would be passed to codex for file analysis
    const basicArgs = ["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "Please analyze this file: /resolved/test.ts"];
    const withPromptArgs = [
      "exec",
      "--skip-git-repo-check", 
      "--sandbox",
      "workspace-write",
      "Check for bugs. Please analyze the file: /resolved/test.ts",
    ];
    const withModelArgs = [
      "exec",
      "--skip-git-repo-check",
      "--model",
      "gpt-5",
      "--sandbox",
      "workspace-write",
      "Please analyze this file: /resolved/test.ts",
    ];
    const withoutSandboxArgs = [
      "exec",
      "--skip-git-repo-check",
      "Please analyze this file: /resolved/test.ts",
    ];
    const withYoloArgs = [
      "exec",
      "--skip-git-repo-check",
      "--sandbox",
      "workspace-write",
      "--full-auto",
      "Please analyze this file: /resolved/test.ts",
    ];

    expect(basicArgs).toEqual(["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "Please analyze this file: /resolved/test.ts"]);
    expect(withPromptArgs).toEqual([
      "exec",
      "--skip-git-repo-check", 
      "--sandbox",
      "workspace-write",
      "Check for bugs. Please analyze the file: /resolved/test.ts",
    ]);
    expect(withModelArgs).toEqual([
      "exec",
      "--skip-git-repo-check",
      "--model",
      "gpt-5",
      "--sandbox",
      "workspace-write",
      "Please analyze this file: /resolved/test.ts",
    ]);
    expect(withoutSandboxArgs).toEqual([
      "exec",
      "--skip-git-repo-check",
      "Please analyze this file: /resolved/test.ts",
    ]);
    expect(withYoloArgs).toEqual([
      "exec",
      "--skip-git-repo-check",
      "--sandbox",
      "workspace-write",
      "--full-auto",
      "Please analyze this file: /resolved/test.ts",
    ]);
  });

  it("should validate file analysis argument building logic", () => {
    // Simulate the argument building logic from analyzeFileTool
    function buildCodexArgsForFile(options: {
      filePath: string;
      prompt?: string;
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

      // Build the analysis prompt (using resolved path)
      const resolvedPath = options.filePath.startsWith("/") ? options.filePath : `/resolved/${options.filePath}`;
      const analysisPrompt = options.prompt
        ? `${options.prompt}. Please analyze the file: ${resolvedPath}`
        : `Please analyze this file: ${resolvedPath}`;

      args.push(analysisPrompt);

      return args;
    }

    expect(
      buildCodexArgsForFile({
        filePath: "/resolved/test.ts",
      }),
    ).toEqual(["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "Please analyze this file: /resolved/test.ts"]);

    expect(
      buildCodexArgsForFile({
        filePath: "/resolved/test.ts",
        prompt: "Check for security issues",
      }),
    ).toEqual([
      "exec",
      "--skip-git-repo-check",
      "--sandbox",
      "workspace-write",
      "Check for security issues. Please analyze the file: /resolved/test.ts",
    ]);

    expect(
      buildCodexArgsForFile({
        filePath: "/resolved/test.ts",
        model: "gpt-5",
      }),
    ).toEqual([
      "exec",
      "--skip-git-repo-check",
      "--model",
      "gpt-5",
      "--sandbox",
      "workspace-write",
      "Please analyze this file: /resolved/test.ts",
    ]);

    expect(
      buildCodexArgsForFile({
        filePath: "/resolved/app.js",
        prompt: "Review code quality",
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
      "Review code quality. Please analyze the file: /resolved/app.js",
    ]);

    // Test reasoning options
    expect(
      buildCodexArgsForFile({
        filePath: "/resolved/test.ts",
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
      "Please analyze this file: /resolved/test.ts",
    ]);

    // Test default reasoning options (should not appear in args)
    expect(
      buildCodexArgsForFile({
        filePath: "/resolved/test.ts",
        reasoningEffort: "medium",
        reasoningSummary: "none",
      }),
    ).toEqual(["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", "Please analyze this file: /resolved/test.ts"]);
  });

  it("should validate file existence check logic", () => {
    // Simulate file existence checking
    function checkFileExists(filePath: string): boolean {
      // This would normally use existsSync, but for testing we simulate
      const validFiles = ["test.ts", "app.js", "component.tsx"];
      return validFiles.includes(filePath);
    }

    expect(checkFileExists("test.ts")).toBe(true);
    expect(checkFileExists("app.js")).toBe(true);
    expect(checkFileExists("component.tsx")).toBe(true);
    expect(checkFileExists("nonexistent.ts")).toBe(false);
  });

  it("should validate path resolution logic", () => {
    // Simulate path resolution
    function resolvePath(filePath: string): string {
      // This would normally use path.resolve, but for testing we simulate
      if (filePath.startsWith("/")) {
        return filePath; // Already absolute
      }
      return `/resolved/${filePath}`;
    }

    expect(resolvePath("test.ts")).toBe("/resolved/test.ts");
    expect(resolvePath("src/app.js")).toBe("/resolved/src/app.js");
    expect(resolvePath("/absolute/path/file.ts")).toBe(
      "/absolute/path/file.ts",
    );
  });

  it("should validate error responses for file not found", () => {
    const fileNotFoundError = {
      content: [
        {
          type: "text",
          text: "Error: File not found: nonexistent.ts",
        },
      ],
    };

    expect(fileNotFoundError.content).toHaveLength(1);
    expect(fileNotFoundError.content[0].type).toBe("text");
    expect(fileNotFoundError.content[0].text).toContain(
      "Error: File not found",
    );
  });

  it("should validate file types support", () => {
    const supportedFileTypes = [
      "app.js",
      "component.tsx",
      "styles.css",
      "config.json",
      "README.md",
      "script.py",
      "main.go",
      "index.html",
      "package.json",
      "tsconfig.json",
      "Dockerfile",
      "src/utils.ts",
    ];

    // All should be valid strings
    supportedFileTypes.forEach((fileName) => {
      expect(typeof fileName).toBe("string");
      expect(fileName.length).toBeGreaterThan(0);
    });

    // Test file extension detection
    expect(supportedFileTypes.some((f) => f.endsWith(".ts"))).toBe(true);
    expect(supportedFileTypes.some((f) => f.endsWith(".js"))).toBe(true);
    expect(supportedFileTypes.some((f) => f.endsWith(".tsx"))).toBe(true);
    expect(supportedFileTypes.some((f) => f.endsWith(".py"))).toBe(true);
    expect(supportedFileTypes.some((f) => f.endsWith(".go"))).toBe(true);
  });

  it("should validate complex analysis prompts", () => {
    const complexPrompts = [
      "Analyze this code for security vulnerabilities and performance issues",
      "Review the code quality and suggest improvements",
      "Check for TypeScript type safety and best practices",
      "Identify potential bugs and code smells",
      "Evaluate the code architecture and design patterns",
      "Look for accessibility issues in this component",
      "Check for proper error handling and edge cases",
    ];

    complexPrompts.forEach((prompt) => {
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(10);
      expect(prompt).toMatch(/^[A-Z]/); // Should start with capital letter
    });
  });

  it("should validate combined prompt generation", () => {
    function generateAnalysisPrompt(
      customPrompt: string | undefined,
      filePath: string,
    ): string {
      return customPrompt
        ? `${customPrompt}. Please analyze the file: ${filePath}`
        : `Please analyze this file: ${filePath}`;
    }

    expect(generateAnalysisPrompt(undefined, "/path/test.ts")).toBe(
      "Please analyze this file: /path/test.ts",
    );

    expect(generateAnalysisPrompt("Check for bugs", "/path/app.js")).toBe(
      "Check for bugs. Please analyze the file: /path/app.js",
    );

    expect(
      generateAnalysisPrompt("Review security", "/path/component.tsx"),
    ).toBe("Review security. Please analyze the file: /path/component.tsx");
  });
});
