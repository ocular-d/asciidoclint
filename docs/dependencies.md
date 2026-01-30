# Package Dependencies

## @asciidoclint/core

Core AsciiDoc linting engine. No internal dependencies.

**External Dependencies:**
- `@asciidoctor/core`: AsciiDoc parsing
- `debug`: Debugging utilities

## @asciidoclint/cli

Command-line interface for the linter.

**Internal Dependencies:**
- `@asciidoclint/core`: Core linting functionality
- `@asciidoclint/rules-standard`: Standard rule set

**External Dependencies:**
- `commander`: CLI framework
- `chalk`: Terminal colors
- `glob`: File pattern matching
- `debug`: Debugging utilities

## @asciidoclint/rules-standard

Standard rule set for common linting checks.

**Internal Dependencies:**
- `@asciidoclint/core`: Rule interfaces and types

**External Dependencies:**
- `debug`: Debugging utilities

## Examples

Example projects use workspace dependencies during development:

```json
{
  "dependencies": {
    "@asciidoclint/cli": "workspace:*"
  }
}
```

These are replaced with actual versions during release validation.