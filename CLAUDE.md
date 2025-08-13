# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that wraps OpenAI's CodeX CLI, enabling AI assistants to interact with CodeX through two main tools: `chat` and `analyzeFile`. The server acts as a bridge between MCP clients (like Claude Desktop) and the CodeX CLI.

## Development Commands

```bash
# Start development server with watch mode
bun run dev

# Build for production
bun run build

# Run all tests
bun test

# Run only unit tests (integration tests in tools/ and index.test.ts)
bun run test:unit

# Run only E2E tests (requires CodeX CLI installed)
bun run test:e2e

# Lint and format code
bun run lint
bun run format
```

## Architecture

### Core Components

- **`index.ts`**: Main MCP server entry point that defines tools and handles MCP protocol communication
- **`tools/chat.ts`**: Implements direct CodeX CLI interaction for conversational AI
- **`tools/analyzeFile.ts`**: Implements file analysis by passing file paths to CodeX CLI
- **`tests/e2e.test.ts`**: End-to-end tests that verify actual CodeX CLI integration

### CodeX CLI Integration

Both tools execute `codex` commands with the `--skip-git-repo-check` flag to allow operation outside Git repositories. Key flag mappings:

- `sandbox: true` → `--sandbox workspace-write`
- `yolo: true` → `--full-auto`
- `model` → `--model <value>` (defaults to gpt-5)

The tools use `spawn()` to execute CodeX CLI commands and return stdout/stderr as MCP tool results.

### Test Structure

- **Unit/Integration tests**: `tools/*.integration.test.ts` - Test argument building logic without executing actual CodeX commands
- **E2E tests**: `tests/e2e.test.ts` - Execute real CodeX CLI commands (requires CodeX CLI installation)
- **Server tests**: `index.test.ts` - Basic MCP server structure validation

## Important Implementation Details

### CodeX CLI Requirements

- Must have OpenAI CodeX CLI installed and accessible in PATH
- Uses `--skip-git-repo-check` flag in all commands to bypass Git repository requirements
- Commands are executed via `child_process.spawn()` with `shell: true`

### MCP Tool Schemas

Tools accept these parameters:
- `prompt` (required for chat, optional for analyzeFile)
- `filePath` (required for analyzeFile only)
- `model`, `sandbox`, `yolo` (all optional)

### Error Handling

- File existence checked before analysis
- CodeX CLI execution errors caught and returned as MCP error responses
- Non-zero exit codes treated as errors unless stdout contains content

## Runtime Environment

- Uses Bun for development and building
- Node.js 20+ required for production
- TypeScript with ES modules
- Biome for linting and formatting