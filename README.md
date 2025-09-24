# asciidoc-linter

Basic AsciiDoc linter written in TypeScript.

> This is a hobby project to learn some TypeScript basics.

# Development Dependencies

- [bun](https://bun.com/)

## How to add a new rule

Add a new file `src/rules/your-rule.ts` that exports a default Rule object.

Implement `check(content: string): Issue[]` and return any issues.

The CLI will automatically pick up any `.ts` or `.js` files in `src/rules/`.

Example skeleton:

```typescript
import { Rule } from '../types';
export default {
id: 'your-rule-id',
description: 'Short description',
check(content) {
// return Issue[]
return [];
}
};
```

### Quick Recipe for Writing New Rules

1. Create a file in `src/rules/` with a clear name.
2. Export a default `Rule` object with:
    - `id` (unique string)
    - `description`
    - `check(content: string): Issue[]`
3. Return `Issue[]` with `ruleId`, `message`, `line`, `column`.
4. Run the CLI → it auto-loads your rule.

### Tests

Run `bun test` for some basic tests.

## Commands

```shell
bun run src/cli.ts --help
bun run src/cli.ts --version
bun run src/cli.ts --rules
bun run src/cli.ts --format json test.adoc
```

## Usage

The entry point is `src/cli.ts`. In the `package.json`, the `bin` field points to it.
To run locally without publishing:

```shell
bun run src/cli.ts test.adoc
```

That will lint `test.adoc` with the built-in rules.
If everything’s good, you’ll see something like:

```txt
test.adoc: OK
```

If rules are triggered (e.g. a line > 120 chars or underline heading style), you’ll see output like:

```
test.adoc:3:121  line-length  Line longer than 120 characters (135)
test.adoc:7:1    heading-style-equals  Underline style headings detected — prefer "== Title" style
```

### Run with stdin

```shell
cat test.adoc | bun run src/cli.ts
```

### Rules

Overview about available rules

| Rule                              | Description                                                            | Default   |
| --------------------------------- | ---------------------------------------------------------------------- | --------- |
| heading-style-equals              | Prefer "==" style headings for level 1 (e.g. "== Heading Two")               | undefined |
| line-length                       | Line should not exceed 120 characters                                  | 120       |
| no-todo                           | Do not leave TODO markers in files                                     |           |
| no-multiple-blanks                | Multiple consecutive blank lines should not occur                      |           |
| heading-level                     | Enforce a maximum heading level                                        | 3         |
| heading-surrounded-by-blank-lines | Headings should be surrounded by blank lines (except level 1 headings) |           |

For a full overview about all available rules run `bun run src/cli.ts --rules`.

To do: Add docs with pointing to all the test cases and example files.

### Configuration

On default all rules are enabled.

If you want to disable certain rules, you can create a custom config `JSON` file, for example `adoc-lint.json` to configure which rules to use.

```json
{
  "rules": {
    "heading-style-equals": true,
    "line-length": false
  }
}
```

Example: `adoc-lint --config adoc-lint.json test.adoc`

#### Configure line length

You can configure the line length by adding your cur custom setting to the optional configuration file:

```json
{
  "rules": {
    "heading-style-equals": true,
    "line-length": { "max": 100 }
  }
}
```

#### Ignore rules inline

You can ignore rules inline by using the `// adoc-lint disable $RULE` command, see the following example:

```adoc
= Title

// adoc-lint disable line-length
This line is intentionally way too long and would normally trigger line-length but we are ignoring it. This is very long yes and it should be ignored.
// adoc-lint enable line-length

This is a long line and should be reported as it is too long and this is what we want this is a test if that is working. Why is this happening?
```

## (Optional) Install globally during dev

If you want to type `adoc-lint` instead of `bun run...`"

```shell
bun link
```

That makes `adoc-lint` available in your shell (symlinked to this project).
