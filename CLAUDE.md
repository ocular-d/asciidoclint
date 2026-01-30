# Claude AI Coding Assistant Guide for AsciiDocLint

This file provides guidance to AI coding agents like Claude Code (claude.ai/code), Cursor AI, Codex, Gemini CLI, GitHub Copilot, and other AI coding assistants when working with code in this repository.

## Project Overview

AsciiDocLint is a TypeScript-based monorepo providing comprehensive AsciiDoc linting capabilities. The project consists of three core packages that work together:

- `@asciidoclint/core` - The linting engine with configurable rules and Asciidoctor.js integration
- `@asciidoclint/cli` - Command-line interface with glob pattern support and multiple output formats
- `@asciidoclint/rules-standard` - Standard rule implementations for common documentation quality checks

## Essential Commands

### Workspace-Level Operations
```bash
# Install dependencies across all packages
pnpm install

# Build all packages (required before CLI usage)
pnpm build

# Run tests across all packages
pnpm test

# Development with watch mode across packages
pnpm dev

# Type check all TypeScript code
pnpm type-check

# Clean all build artifacts
pnpm clean
```

### Package-Specific Development
```bash
# Work on core engine with watch mode
cd packages/core && pnpm dev

# Work on CLI with watch mode
cd packages/cli && pnpm dev

# Work on rules with watch mode
cd packages/rules-standard && pnpm dev

# Run tests for specific package
cd packages/[package-name] && pnpm test

# Test CLI locally after building
cd examples/basic-project && pnpm test
```

### Testing Different Configurations
```bash
# Test with basic configuration
cd examples/basic-project && asciidoclint docs/*.adoc

# Test with complex multi-config setup
cd examples/complex-project && npm run test

# Test specific rule types
cd examples/complex-project && npm run test:api
cd examples/complex-project && npm run test:guides
```

## Architecture Overview

### Core Engine Architecture (`packages/core`)
The `AsciiDocLinter` class is the central engine that:
- Uses `@asciidoctor/core` for parsing AsciiDoc documents
- Maintains a `Map<string, LintRule>` for rule management
- Processes rules with configurable severity levels
- Returns structured `LintResult` objects with error/warning counts

### Rule System
Rules implement the `LintRule` interface with:
- `name`: Unique identifier
- `description`: Human-readable description
- `severity`: Default severity level ('error' | 'warning' | 'info')
- `check(document, context)`: Main validation logic

Rules are loaded from `@asciidoclint/rules-standard` and can be:
- Enabled/disabled via configuration
- Overridden for severity levels
- Extended with custom implementations

### CLI Architecture (`packages/cli`)
The CLI uses Commander.js with:
- Glob pattern support for file matching
- Multiple output formatters
- Configuration loading from files
- Integration with all three packages

### Workspace Dependencies
- `workspace:*` dependencies link local packages
- Shared TypeScript configuration via root `tsconfig.json`
- Jest configuration covers all packages from root
- pnpm workspaces handle dependency management

## Development Patterns

### Adding New Rules
1. Create rule file in `packages/rules-standard/src/rules/`
2. Implement `LintRule` interface with proper typing
3. Export from `packages/rules-standard/src/index.ts`
4. Add to `loadStandardRules()` function
5. Test with examples in `examples/` directory

### Working with Asciidoctor.js
- Documents are parsed using `asciidoctor().load(content)`
- Access source lines via `document.getSourceLines?.()`
- Use document traversal for structural analysis
- Handle cases where source methods may not exist

### Configuration System
- CLI loads config via `loadConfig()` function
- Rules can be configured as `'error' | 'warning' | 'info' | 'off'`
- Examples show different config patterns for different document types
- Rule-specific options passed via `context.options.rules[ruleName]`

### Testing Strategy
- Jest configured at workspace root to test all packages
- Example projects serve as integration tests
- Individual rule testing via unit tests
- CLI testing through example projects

### Build System
- TypeScript compilation with `tsc`
- CLI binary requires executable permissions via `chmod +x`
- Build order: core → rules-standard → cli
- Watch mode available for all packages during development

## Key Files to Understand

- [packages/core/src/index.ts](packages/core/src/index.ts) - Main linting engine
- [packages/core/src/types.ts](packages/core/src/types.ts) - Core type definitions
- [packages/cli/src/index.ts](packages/cli/src/index.ts) - CLI entry point
- [packages/rules-standard/src/index.ts](packages/rules-standard/src/index.ts) - Rule loading
- [examples/complex-project/](examples/complex-project/) - Advanced configuration patterns
- [jest.config.js](jest.config.js) - Testing configuration
- [pnpm-workspace.yaml](pnpm-workspace.yaml) - Workspace configuration

## Package Manager Notes

- Uses pnpm with workspace linking (`workspace:*`)
- Shared lockfile across all packages
- Version constraints enforced via `dependencyOverrides`
- Publishing configured for npm registry with public access

## Rules

- Always validate and fix TypeScript errors
- Always validate `imports`