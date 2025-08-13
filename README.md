# MCP CodeX CLI

OpenAI CodeX CLI用のModel Context Protocol (MCP)サーバー実装

## 概要

このMCPサーバーは、OpenAI CodeX CLIをMCPクライアント（Claude Desktop等）から直接利用できるようにします。

**提供機能:**
- **Chat**: CodeX CLIとの対話機能
- **AnalyzeFile**: ファイル分析機能

## 前提条件

- **Node.js 20以上**
- **Bun** - [インストールガイド](https://bun.sh/)
- **OpenAI CodeX CLI** - インストール方法は[公式リポジトリ](https://github.com/openai/codex)を参照

### CodeX CLI クイックインストール (macOS)

```bash
brew install codex
codex
```

## インストール

```bash
git clone https://github.com/yu-orz/mcp-codex-cli
cd mcp-codex-cli
bun install
```

## 使用方法

### Chat Tool

CodeX CLIとの対話：

**基本:**
```
CodeXに「Hello, can you help me write a Python function?」と聞いて
```

**オプション付き:**
```
CodeXにモデルgpt-5、サンドボックスモードで「このコードを最適化して」と聞いて
```

### Analyze File Tool

ファイル分析：

**基本:**
```
./src/app.js ファイルを分析して
```

**カスタムプロンプト:**
```
./components/Button.tsx ファイルを「パフォーマンス観点で」分析して
```

## パラメータ

### Chat Tool

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|------|------|----------|------|
| `prompt` | string | ✅ | - | CodeXへのプロンプト |
| `model` | string | ❌ | `gpt-5` | 使用モデル |
| `sandbox` | boolean | ❌ | `true` | サンドボックスモード |
| `yolo` | boolean | ❌ | `false` | 全自動モード |

### Analyze File Tool

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|------|------|----------|------|
| `filePath` | string | ✅ | - | 分析対象ファイルパス |
| `prompt` | string | ❌ | `"Please analyze this file"` | カスタム分析プロンプト |
| `model` | string | ❌ | `gpt-5` | 使用モデル |
| `sandbox` | boolean | ❌ | `true` | サンドボックスモード |
| `yolo` | boolean | ❌ | `false` | 全自動モード |

### オプション説明

- **sandbox**: `true` → `--sandbox workspace-write` (ワークスペース内のみ安全に実行)
- **yolo**: `true` → `--full-auto` (確認なしで自動実行、**注意して使用**)

## 実行されるコマンド

このMCPサーバーは内部で以下のようなCodeX CLIコマンドを生成・実行します：

```bash
# Chat Tool
codex exec --skip-git-repo-check [--model gpt-5] [--sandbox workspace-write] [--full-auto] "プロンプト"

# Analyze File Tool
codex exec --skip-git-repo-check [オプション] "カスタムプロンプト. Please analyze the file: ファイルパス"
```

## 開発

```bash
# 開発サーバー
bun run dev

# テスト実行 (27テスト)
bun test

# ユニットテストのみ (17テスト)
bun run test:unit

# E2Eテストのみ (10テスト)
bun run test:e2e

# リント
bun run lint

# ビルド
bun run build
```

## MCP設定例

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

## ライセンス

MIT License

---

> このプロジェクトはOpenAIの公式プロダクトではありません。CodeX CLIの非公式MCPインテグレーションです。