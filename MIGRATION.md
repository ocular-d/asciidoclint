# Migration from Bun to pnpm and Node.js

This document summarizes the migration of the AsciiDoc linter from Bun to pnpm and Node.js.

## Changes Made

### 1. Package Configuration (`package.json`)
- **Changed description**: From "TypeScript + Bun" to "TypeScript + Node.js"
- **Updated bin entry**: From `./src/cli.ts` to `./dist/cli.js` (compiled output)
- **Added main/types fields**: For proper package distribution
- **Updated scripts**: 
  - `start/check`: From `bun run` to `npm run build && node`
  - Added `build`, `test`, `dev`, `prepublishOnly` scripts
- **Updated dependencies**: 
  - Removed `@types/bun`
  - Added `@types/node`, `typescript`, `vitest`
- **Added Node.js version requirement**: `>=18.0.0`

### 2. TypeScript Configuration (`tsconfig.json`)
- **Changed module system**: From `"Preserve"` to `"Node16"` for Node.js compatibility
- **Updated module resolution**: From `"bundler"` to `"Node16"`
- **Disabled Bun-specific features**: 
  - `allowImportingTsExtensions: false`
  - `verbatimModuleSyntax: false`
- **Added compilation output**: `outDir: "./dist"`, `rootDir: "./src"`
- **Enabled declaration files**: For better TypeScript support

### 3. Import/Export Updates
- **Fixed all imports**: Changed from `.ts` to `.js` extensions for Node.js ESM compatibility
- **Updated test imports**: From `bun:test` to `vitest`
- **Fixed CLI imports**: Replaced `require("os")` with proper ESM import

### 4. CLI Updates
- **Changed shebang**: From `#!/usr/bin/env bun` to `#!/usr/bin/env node`
- **Fixed entry point detection**: Replaced Bun's `import.meta.main` with Node.js equivalent

### 5. Rule Loading Fix
- **Updated dynamic imports**: Changed to only load `.js` files in production (compiled output)

### 6. Testing Setup
- **Switched to Vitest**: From Bun's built-in test runner to Vitest
- **Added vitest config**: For proper test configuration

## Module System Decision

**We kept ESM (ES Modules)** instead of switching to CommonJS because:

1. **Already in use**: The project was already using ESM syntax (`import/export`)
2. **Modern standard**: ESM is the future of JavaScript/TypeScript
3. **Node.js support**: Excellent ESM support in Node.js 18+
4. **Less migration work**: No need to rewrite all imports/exports
5. **Better tree shaking**: ESM enables better optimization

## Commands

### Development
```bash
pnpm install          # Install dependencies
pnpm run build        # Compile TypeScript to JavaScript
pnpm run dev          # Watch mode compilation
pnpm run test         # Run tests
pnpm run test:watch   # Run tests in watch mode
```

### Usage
```bash
pnpm run start -- --help           # Show help
pnpm run start -- test.adoc        # Lint a file
node ./dist/cli.js test.adoc        # Direct execution
```

### Publishing
```bash
pnpm run prepublishOnly            # Builds before publishing
pnpm publish                       # Publish to npm
```

## Verification

✅ **Build**: `npm run build` compiles successfully  
✅ **CLI**: Commands work (`--help`, `--version`, file linting)  
✅ **Tests**: All tests pass with Vitest  
✅ **Rule loading**: Dynamic import of rules works correctly  
✅ **Package structure**: Proper dist/ output with declarations  

## Next Steps

1. **Consider updating package name**: The package scope `@testthedocs/asciidoc-lint` is clear
2. **Add CI/CD**: Set up GitHub Actions for automated testing and publishing
3. **Documentation**: Update README.md to reflect new installation/usage with pnpm
4. **Performance**: The Node.js version should have similar performance to Bun for this use case

The migration is complete and the project now works seamlessly with pnpm and Node.js!