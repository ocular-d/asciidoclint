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

## Commands

```shell
bun run src/cli.ts --help
bun run src/cli.ts --version
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

## (Optional) Install globally during dev

If you want to just type `asciidoc-lint` instead of `bun run...`"

```shell
bun link
```

That makes `asciidoc-lint` available in your shell (symlinked to this project).
