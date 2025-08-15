import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("MCP Integration Tests", () => {
  let testDir: string;
  let testFile: string;

  beforeAll(async () => {
    // テスト用の一時ディレクトリとファイルを作成
    testDir = await mkdtemp(join(tmpdir(), "mcp-integration-test-"));
    testFile = join(testDir, "test.js");

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
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("テストクリーンアップエラー:", error);
    }
  });

  it("should respond to MCP tools/list request", async () => {
    console.log("🧪 テスト開始: MCPツール一覧取得");
    
    const response = await sendMCPRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {}
    });

    expect(response.id).toBe(1);
    expect(response.result).toBeDefined();
    expect(response.result.tools).toBeArray();
    expect(response.result.tools).toHaveLength(2);
    
    const toolNames = response.result.tools.map((tool: any) => tool.name);
    expect(toolNames).toContain("chat");
    expect(toolNames).toContain("analyzeFile");
    
    console.log("✅ テスト成功: MCPツール一覧取得");
  }, 10000);

  it("should execute chat tool via MCP", async () => {
    console.log("🧪 テスト開始: MCPチャットツール実行");
    
    const response = await sendMCPRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "chat",
        arguments: {
          prompt: "What is 2+2? Give me just the number.",
          model: "gpt-5"
        }
      }
    });

    expect(response.id).toBe(2);
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeArray();
    expect(response.result.content[0].type).toBe("text");
    expect(response.result.content[0].text).toContain("4");
    
    console.log("✅ テスト成功: MCPチャットツール実行");
  }, 60000);

  it("should execute analyzeFile tool via MCP", async () => {
    console.log("🧪 テスト開始: MCPファイル分析ツール実行");
    
    const response = await sendMCPRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "analyzeFile",
        arguments: {
          filePath: testFile,
          prompt: "Focus on the divide function"
        }
      }
    });

    expect(response.id).toBe(3);
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeArray();
    expect(response.result.content[0].type).toBe("text");
    expect(response.result.content[0].text.toLowerCase()).toMatch(/division|divide|zero/);
    
    console.log("✅ テスト成功: MCPファイル分析ツール実行");
  }, 60000);

  it("should handle invalid tool name", async () => {
    console.log("🧪 テスト開始: 無効なツール名のエラーハンドリング");
    
    const response = await sendMCPRequest({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "nonexistent",
        arguments: {}
      }
    });

    expect(response.id).toBe(4);
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeArray();
    expect(response.result.content[0].type).toBe("text");
    expect(response.result.content[0].text).toContain("Unknown tool");
    
    console.log("✅ テスト成功: 無効なツール名のエラーハンドリング");
  }, 10000);

  it("should handle missing required parameters", async () => {
    console.log("🧪 テスト開始: 必須パラメータ不足のエラーハンドリング");
    
    const response = await sendMCPRequest({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "chat",
        arguments: {} // promptが不足
      }
    });

    expect(response.id).toBe(5);
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeArray();
    expect(response.result.content[0].type).toBe("text");
    expect(response.result.content[0].text).toContain("requires a 'prompt' parameter");
    
    console.log("✅ テスト成功: 必須パラメータ不足のエラーハンドリング");
  }, 10000);

  it("should handle non-existent file in analyzeFile", async () => {
    console.log("🧪 テスト開始: 存在しないファイルのエラーハンドリング");
    
    const nonExistentFile = join(testDir, "does-not-exist.js");
    const response = await sendMCPRequest({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "analyzeFile",
        arguments: {
          filePath: nonExistentFile
        }
      }
    });

    expect(response.id).toBe(6);
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeArray();
    expect(response.result.content[0].type).toBe("text");
    expect(response.result.content[0].text).toContain("File not found");
    
    console.log("✅ テスト成功: 存在しないファイルのエラーハンドリング");
  }, 10000);

  it("should handle reasoning parameters", async () => {
    console.log("🧪 テスト開始: 推論パラメータの処理");
    
    const response = await sendMCPRequest({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "chat",
        arguments: {
          prompt: "Simple test",
          reasoningEffort: "low",
          reasoningSummary: "auto"
        }
      }
    });

    expect(response.id).toBe(7);
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeArray();
    expect(response.result.content[0].type).toBe("text");
    
    console.log("✅ テスト成功: 推論パラメータの処理");
  }, 60000);
});

// Helper function to send MCP requests and get responses
async function sendMCPRequest(request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log(`🔧 MCP要求送信: ${request.method}`);
    
    const server = spawn("node", ["./dist/index.js", "--allow-npx"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let responseReceived = false;
    let serverReady = false;

    server.stdout?.on("data", (data) => {
      const chunk = data.toString();
      stdout += chunk;
      console.log(`📤 STDOUT: ${chunk.trim()}`);
      
      // JSON-RPCレスポンスを探す
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.trim() && line.startsWith('{') && !responseReceived) {
          try {
            const response = JSON.parse(line.trim());
            if (response.id === request.id) {
              console.log(`📥 受信: ${JSON.stringify(response)}`);
              responseReceived = true;
              server.kill();
              resolve(response);
              return;
            }
          } catch (e) {
            // JSON解析エラーは無視（ログメッセージなど）
          }
        }
      }
    });

    server.stderr?.on("data", (data) => {
      const chunk = data.toString();
      stderr += chunk;
      console.log(`📤 STDERR: ${chunk.trim()}`);
      
      // MCPサーバーの起動完了メッセージを待つ
      if (chunk.includes("CodeX CLI MCP server started") && !serverReady) {
        serverReady = true;
        // サーバーが起動したので、少し待ってからリクエストを送信
        setTimeout(() => {
          const requestStr = JSON.stringify(request) + "\n";
          console.log(`📤 送信: ${requestStr.trim()}`);
          server.stdin?.write(requestStr);
        }, 100);
      }
    });

    server.on("close", (code) => {
      if (!responseReceived) {
        console.log(`❌ サーバー終了: 終了コード=${code}`);
        console.log(`📋 STDOUT: ${stdout}`);
        console.log(`📋 STDERR: ${stderr}`);
        reject(new Error(`MCPサーバーからレスポンスを受信できませんでした (終了コード: ${code})`));
      }
    });

    server.on("error", (error) => {
      console.log(`❌ プロセスエラー: ${error.message}`);
      reject(error);
    });

    // タイムアウト設定
    setTimeout(() => {
      if (!responseReceived) {
        server.kill();
        reject(new Error("MCPリクエストがタイムアウトしました"));
      }
    }, 30000);
  });
}