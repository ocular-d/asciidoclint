# AsciiDoc Linter Workspace# asciidoc-linter



This repository has been restructured to use **pnpm workspaces** with three distinct packages:Basic AsciiDoc linter written in TypeScript.



## 📁 Repository Structure> This is a hobby project to learn some TypeScript basics.



```# Development Dependencies

asciidoc-linter/

├── packages/- [bun](https://bun.com/)

│   ├── asciidoc-linter/    # The core linter tool

│   ├── docs/               # Antora-based documentation## How to add a new rule

│   └── theme/              # Custom Antora theme

├── pnpm-workspace.yaml     # Workspace configurationAdd a new file `src/rules/your-rule.ts` that exports a default Rule object.

├── package.json            # Root workspace package

└── README.md              # This fileImplement `check(content: string): Issue[]` and return any issues.

```

The CLI will automatically pick up any `.ts` or `.js` files in `src/rules/`.

## 🏗️ Workspaces

Example skeleton:

### 1. **@testthedocs/asciidoc-linter** (`packages/asciidoc-linter/`)

The main AsciiDoc linter tool built with TypeScript and Node.js.```typescript

import { Rule } from '../types';

**Features:**export default {

- ✅ Extensible rule systemid: 'your-rule-id',

- ✅ CLI and programmatic APIdescription: 'Short description',

- ✅ Configurable rulescheck(content) {

- ✅ TypeScript support// return Issue[]

- ✅ ESM modulesreturn [];

}

### 2. **@testthedocs/docs** (`packages/docs/`)};

Documentation website built with Antora.```



**Features:**### Quick Recipe for Writing New Rules

- 📖 Installation guide

- 📖 Usage examples1. Create a file in `src/rules/` with a clear name.

- 📖 API documentation2. Export a default `Rule` object with:

- 📖 Rule reference    - `id` (unique string)

    - `description`

### 3. **@testthedocs/antora-theme** (`packages/theme/`)    - `check(content: string): Issue[]`

Custom Antora UI theme for the documentation.3. Return `Issue[]` with `ruleId`, `message`, `line`, `column`.

4. Run the CLI → it auto-loads your rule.

**Features:**

- 🎨 Custom styling### Tests

- 🎨 Responsive design

- 🎨 Modern look and feelRun `bun test` for some basic tests.



## 🚀 Quick Start## Commands



### Prerequisites```shell

- Node.js 18.0.0 or laterbun run src/cli.ts --help

- pnpm 8.0.0 or laterbun run src/cli.ts --version

bun run src/cli.ts --rules

### Installationbun run src/cli.ts --format json test.adoc

```bash```

# Clone the repository

git clone https://github.com/ocular-d/asciidoc-linter.git## Usage

cd asciidoc-linter

The entry point is `src/cli.ts`. In the `package.json`, the `bin` field points to it.

# Install all workspace dependenciesTo run locally without publishing:

pnpm install

```shell

# Build all packagesbun run src/cli.ts test.adoc

pnpm run build```

```

That will lint `test.adoc` with the built-in rules.

## 📋 Available ScriptsIf everything’s good, you’ll see something like:



### Workspace-level commands (run from root):```txt

test.adoc: OK

```bash```

# Build all packages

pnpm run buildIf rules are triggered (e.g. a line > 120 chars or underline heading style), you’ll see output like:



# Test all packages```

pnpm run testtest.adoc:3:121  line-length  Line longer than 120 characters (135)

test.adoc:7:1    heading-style-equals  Underline style headings detected — prefer "== Title" style

# Development mode for all packages```

pnpm run dev

### Run with stdin

# Clean all build outputs

pnpm run clean```shell

```cat test.adoc | bun run src/cli.ts

```

### Package-specific commands:

### Rules

```bash

# AsciiDoc LinterOverview about available rules

pnpm linter:start <file.adoc>                    # Run linter on a file

pnpm --filter @testthedocs/asciidoc-linter test  # Run linter tests| Rule                              | Description                                                            | Default   |

| --------------------------------- | ---------------------------------------------------------------------- | --------- |

# Documentation| heading-style-equals              | Prefer "==" style headings (e.g. "== Heading Two")         | undefined |

pnpm docs:build                                  # Build documentation| line-length                       | Line should not exceed 120 characters                                  | 120       |

pnpm docs:dev                                    # Development server| no-todo                           | Do not leave TODO markers in files                                     |           |

pnpm --filter @testthedocs/docs serve           # Serve built docs| no-multiple-blanks                | Multiple consecutive blank lines should not occur                      |           |

| heading-level                     | Enforce a maximum heading level                                        | 3         |

# Theme| heading-surrounded-by-blank-lines | Headings should be surrounded by blank lines (except level 1 headings) |           |

pnpm theme:build                                 # Build theme bundle| table-surrounded-by-blank-lines   | Tables should be surrounded by blank lines and not stacked without separation |    |

pnpm theme:dev                                   # Development mode

```For a full overview about all available rules run `bun run src/cli.ts --rules`.



## 🔧 DevelopmentTo do: Add docs with pointing to all the test cases and example files.



### Working on the linter:### Configuration

```bash

cd packages/asciidoc-linterOn default all rules are enabled.

pnpm run dev          # Watch mode compilation

pnpm run test:watch   # Test watch modeIf you want to disable certain rules, you can create a custom config `JSON` file, for example `adoc-lint.json` to configure which rules to use.

```

```json

### Working on documentation:{

```bash  "rules": {

cd packages/docs    "heading-style-equals": true,

pnpm run dev         # Build docs in development mode    "line-length": false

pnpm run serve       # Serve the built site  }

```}

```

### Working on the theme:

```bashExample: `adoc-lint --config adoc-lint.json test.adoc`

cd packages/theme

pnpm run dev         # Build theme without bundling#### Configure line length

pnpm run build       # Create production bundle

```You can configure the line length by adding your cur custom setting to the optional configuration file:



## 📦 Package Dependencies```json

{

The workspace is configured so that:  "rules": {

- **Root package**: Manages shared DevDependencies (TypeScript, @types/node)    "heading-style-equals": true,

- **Linter package**: Independent with its own dependencies (vitest, etc.)    "line-length": { "max": 100 }

- **Docs package**: Antora and documentation tools  }

- **Theme package**: Gulp build system and UI dependencies}

```

## 🏃‍♂️ Testing the Setup

#### Ignore rules inline

Verify everything works:

You can ignore rules inline by using the `// adoc-lint disable $RULE` command, see the following example:

```bash

# Test the linter```adoc

pnpm --filter @testthedocs/asciidoc-linter run start test.adoc= Title



# Build the theme// adoc-lint disable line-length

pnpm --filter @testthedocs/antora-theme run buildThis line is intentionally way too long and would normally trigger line-length but we are ignoring it. This is very long yes and it should be ignored.

// adoc-lint enable line-length

# Run all tests

pnpm run testThis is a long line and should be reported as it is too long and this is what we want this is a test if that is working. Why is this happening?

``````



## 🔄 Migration Notes## (Optional) Install globally during dev



This workspace was migrated from:If you want to type `adoc-lint` instead of `bun run...`"

- **Bun** → **Node.js + pnpm**

- **Monolithic structure** → **pnpm workspaces**```shell

- **Single package** → **Three focused packages**bun link

```

### Benefits of the new structure:

- ✅ **Separation of concerns**: Each package has a single responsibilityThat makes `adoc-lint` available in your shell (symlinked to this project).

- ✅ **Independent versioning**: Packages can be released independently
- ✅ **Better development experience**: Work on specific parts without rebuilding everything
- ✅ **Scalability**: Easy to add new packages (CLI tools, plugins, etc.)
- ✅ **Modern tooling**: pnpm workspaces with excellent dependency management

## 📄 License

MIT - See LICENSE file for details.

🚀 Ready to Use:
Test the linter:

pnpm --filter @testthedocs/asciidoc-linter run start test.adoc

Build all packages:
pnpm run build

Run all tests:
pnpm run test

Work on individual packages:
# Linter development
pnpm --filter @testthedocs/asciidoc-linter run dev

# Theme development
pnpm --filter @testthedocs/antora-theme run build

# Documentation
pnpm --filter @testthedocs/docs run dev

Docs - Dev Watch
# Start watch mode
cd packages/docs
pnpm run dev:watch

# In another terminal, serve the site
pnpm run serve