# Release Process

## Overview

Our release process uses a multi-stage validation approach to ensure package quality:

1. **Development** → `main` branch
2. **Staging Release** → Publish with `@next` tag
3. **Automated Validation** → Comprehensive testing
4. **Stable Release** → Promote to `@latest` tag

## Validation Stages

### 1. Installation Testing
- Cross-platform compatibility (Linux, macOS, Windows)
- Multiple Node.js versions (18, 20, 21)
- Package installation verification
- Dependency resolution testing

### 2. Functionality Testing
- CLI command execution
- Core API functionality
- Configuration loading
- Error handling

### 3. Integration Testing
- Real-world project testing
- Package interdependency validation
- Example project execution
- Regression testing

### 4. Performance Testing
- Benchmark execution
- Memory usage analysis
- Execution time validation
- Comparison with baseline metrics

### 5. Security Testing
- Dependency vulnerability scanning
- Package audit checks
- Security best practices validation

## Release Commands

```bash
# Create changeset (describes changes)
pnpm changeset

# Version packages (updates versions based on changesets)
pnpm changeset:version

# Publish staging release
pnpm changeset:publish --tag next

# Validate release (automated via GitHub Actions)
pnpm validate-release

# Promote to stable (after validation passes)
pnpm promote-release
```

## Rollback Procedures

If validation fails:

1. **Automatic Issue Creation** - GitHub issue created with failure details
2. **Manual Investigation** - Review validation logs and fix issues
3. **Package Unpublishing** - Remove failed packages if necessary (within 24h window)
4. **Fix and Retry** - Address issues and create new release

## Monitoring

- **GitHub Actions** - All validation steps logged
- **NPM Registry** - Package download and installation metrics
- **Performance Metrics** - Benchmark results tracked over time
- **Security Alerts** - Automated vulnerability notifications