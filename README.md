# MCP CodeX CLI

CodeX CLI用のModel Context Protocol (MCP)サーバー実装

## 機能

- `chat`: CodeX CLIとの対話機能
- `analyzeFile`: ファイル分析機能

## 前提条件

- Node.js 20以上
- Bun (開発・ビルド用)
- [OpenAI CodeX CLI](https://github.com/openai/codex) がインストールされている必要があります

## インストール

```bash
bun install
```

## 開発

```bash
bun run dev
```

## ビルド

```bash
bun run build
```

## テスト

```bash
# 全テスト実行
bun test

# ウォッチモードでテスト実行
bun run test:watch

# カバレッジ付きテスト実行
bun run test:coverage
```

## Linting & Formatting

```bash
# Linting
bun run lint

# Linting with auto-fix
bun run lint:fix

# Formatting
bun run format
```

## 設定

1. リポジトリをクローンして依存関係をインストール：

```bash
git clone https://github.com/yu-orz/mcp-codex-cli
cd mcp-codex-cli
bun install
```

2. Claude Codeの設定ファイルに追加：

```json
{
  "mcpServers": {
    "mcp-codex-cli": {
      "command": "bun",
      "args": ["run", "/path/to/mcp-codex-cli/index.ts"]
    }
  }
}
```

## 使用方法

### Chat Tool

CodeX CLIとの基本的な対話：

```json
{
  "tool": "chat",
  "arguments": {
    "prompt": "Hello, CodeX! Can you help me write a function?"
  }
}
```

パラメータ付きの対話：

```json
{
  "tool": "chat", 
  "arguments": {
    "prompt": "Explain how to optimize this algorithm",
    "model": "gpt-5",
    "sandbox": true,
    "yolo": false
  }
}
```

### Analyze File Tool

ファイル分析：

```json
{
  "tool": "analyzeFile",
  "arguments": {
    "filePath": "./src/components/Button.tsx"
  }
}
```

カスタムプロンプト付きファイル分析：

```json
{
  "tool": "analyzeFile",
  "arguments": {
    "filePath": "./src/utils/api.ts",
    "prompt": "Check for security vulnerabilities and performance issues",
    "model": "gpt-5",
    "sandbox": true
  }
}
```

## パラメータ

### 共通パラメータ

- `model` (オプション): 使用するモデル（例: "gpt-5"）
- `sandbox` (オプション): サンドボックスモードで実行
- `yolo` (オプション): 全自動モード（--full-auto）

### Chat Tool

- `prompt` (必須): CodeX CLIに送信するプロンプト

### Analyze File Tool

- `filePath` (必須): 分析対象ファイルのパス
- `prompt` (オプション): カスタム分析プロンプト

## CodeX CLIコマンド例

このMCPサーバーは以下のようなCodeX CLIコマンドを実行します：

```bash
# 基本的なチャット
codex "Hello, can you help me?"

# モデル指定
codex --model gpt-5 "Explain this code"

# サンドボックスモード
codex --sandbox workspace-write "Analyze this project"

# 全自動モード
codex --full-auto "Fix the bugs in this file"

# 組み合わせ
codex --model gpt-5 --sandbox workspace-write --full-auto "Refactor this component"
```

## ライセンス

MIT
