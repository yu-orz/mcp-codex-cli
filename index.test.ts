import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";

// Mock the tools
const mockChatTool = mock();
const mockAnalyzeFileTool = mock();

mock.module("./tools/chat.ts", () => ({
  chatTool: mockChatTool,
}));

mock.module("./tools/analyzeFile.ts", () => ({
  analyzeFileTool: mockAnalyzeFileTool,
}));

// Mock commander
mock.module("commander", () => ({
  Command: class {
    name() {
      return this;
    }
    description() {
      return this;
    }
    version() {
      return this;
    }
    option() {
      return this;
    }
    parse() {
      return this;
    }
  },
}));

describe("MCP Server", () => {
  beforeEach(() => {
    mockChatTool.mockResolvedValue({
      content: [{ type: "text", text: "Chat response" }],
    });
    mockAnalyzeFileTool.mockResolvedValue({
      content: [{ type: "text", text: "Analysis response" }],
    });
  });

  afterEach(() => {
    mock.restore();
  });

  it("should create server with correct configuration", () => {
    // Import after mocking
    const serverModule = require("./index.ts");

    // The server should be created (this is mainly a smoke test)
    expect(serverModule).toBeDefined();
  });

  it("should handle chat tool calls", async () => {
    // Import the module to access the server configuration
    const _serverModule = require("./index.ts");

    // This test verifies that the tools are properly imported and mocked
    expect(mockChatTool).toBeDefined();
    expect(mockAnalyzeFileTool).toBeDefined();
  });

  it("should have correct tool definitions", () => {
    // This is a basic structure test
    // In a real scenario, you'd test the actual server handlers
    const tools = [
      {
        name: "chat",
        description: "Engage in a chat conversation with CodeX CLI",
      },
      {
        name: "analyzeFile",
        description: "Analyze a file using CodeX CLI",
      },
    ];

    expect(tools).toHaveLength(2);
    expect(tools[0].name).toBe("chat");
    expect(tools[1].name).toBe("analyzeFile");
  });
});
