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

### 方法1: npx（推奨）

```bash
# プロジェクト固有の設定
claude mcp add -s project mcp-codex-cli -- npx @yu-orz/mcp-codex-cli --allow-npx

# ユーザー全体の設定
claude mcp add -s user mcp-codex-cli -- npx @yu-orz/mcp-codex-cli --allow-npx

# ローカル設定
claude mcp add -s local mcp-codex-cli -- npx @yu-orz/mcp-codex-cli --allow-npx
```

### 方法2: ローカルビルド

```bash
git clone https://github.com/yu-orz/mcp-codex-cli
cd mcp-codex-cli
bun install
bun run build

# ビルド後、Claude MCPに追加
claude mcp add -s project mcp-codex-cli -- bun run $(pwd)/dist/index.js
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
| `reasoningEffort` | string | ❌ | `medium` | 推論レベル (`none`\|`low`\|`medium`\|`high`) |
| `reasoningSummary` | string | ❌ | `none` | 推論要約 (`none`\|`auto`) |

### Analyze File Tool

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|------|------|----------|------|
| `filePath` | string | ✅ | - | 分析対象ファイルパス |
| `prompt` | string | ❌ | `"Please analyze this file"` | カスタム分析プロンプト |
| `model` | string | ❌ | `gpt-5` | 使用モデル |
| `sandbox` | boolean | ❌ | `true` | サンドボックスモード |
| `yolo` | boolean | ❌ | `false` | 全自動モード |
| `reasoningEffort` | string | ❌ | `medium` | 推論レベル (`none`\|`low`\|`medium`\|`high`) |
| `reasoningSummary` | string | ❌ | `none` | 推論要約 (`none`\|`auto`) |

### オプション説明

- **sandbox**: `true` → `--sandbox workspace-write` (ワークスペース内のみ安全に実行)
- **yolo**: `true` → `--full-auto` (確認なしで自動実行、**注意して使用**)
- **reasoningEffort**: 推論レベルを制御 → `-c model_reasoning_effort=値`
  - `none`: 推論なし（最速）
  - `low`: 軽微な推論
  - `medium`: 標準推論（デフォルト）
  - `high`: 詳細な推論（最も時間がかかる）
- **reasoningSummary**: 推論要約の表示制御 → `-c model_reasoning_summary=値`
  - `none`: 推論要約なし（デフォルト）
  - `auto`: 自動で推論要約を表示

## 実行されるコマンド

このMCPサーバーは内部で以下のようなCodeX CLIコマンドを生成・実行します：

```bash
# Chat Tool
codex exec --skip-git-repo-check [--model gpt-5] [--sandbox workspace-write] [--full-auto] [-c model_reasoning_effort=値] [-c model_reasoning_summary=値] "プロンプト"

# Analyze File Tool
codex exec --skip-git-repo-check [オプション] [-c model_reasoning_effort=値] [-c model_reasoning_summary=値] "カスタムプロンプト. Please analyze the file: ファイルパス"
```

### 実行例

```bash
# 基本的なチャット
codex exec --skip-git-repo-check --sandbox workspace-write "Hello CodeX"

# 高精度推論付きチャット
codex exec --skip-git-repo-check --sandbox workspace-write -c model_reasoning_effort=high -c model_reasoning_summary=auto "複雑な問題を解決して"

# 高速チャット（推論なし）
codex exec --skip-git-repo-check --sandbox workspace-write -c model_reasoning_effort=none "簡単な質問"
```

## 開発

```bash
# 開発サーバー
bun run dev

# テスト実行 (24テスト)
bun test

# ユニットテストのみ (17テスト)
bun run test:unit

# E2Eテストのみ (7テスト、CodeX CLI必須)
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