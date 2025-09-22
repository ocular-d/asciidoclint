#!/usr/bin/env bun

import fs from "fs";
import { loadRules } from "./rules/index.ts";
import { runRules } from "./index.ts";
import { readStdin, isAsciiDocFile, readFileSyncUtf8 } from "./utils.ts";

const os = require('os');

const pkg = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url).pathname, "utf8")
);

function printHelp() {
  console.log(`asciidoc-lint ${pkg.version}\n
Usage: asciidoc-lint [options] [files...]

Options:
  -h, --help          Show help
  -v, --version       Show version
  --format [json|text]  Output format (default: text)
  --config <path>     Path to the configuration file
  --rules             List all available rules

Examples:
  asciidoc-lint doc.adoc
  asciidoc-lint test.adoc
     cat doc.adoc | asciidoc-lint --config asciidoc-lint.json
`);
}

async function main(argv: string[]) {
  if (argv.includes("-h") || argv.includes("--help")) {
    printHelp();
    return;
  }
  if (argv.includes("-v") || argv.includes("--version")) {
    console.log("Version:",pkg.version);
    console.log("OS Arch:",os.arch());
    return;
  }

  if (argv.includes("--rules")) {
    const rules = await loadRules();
    rules.forEach(rule => console.log(`${rule.id}: ${rule.description}`));
    return;
  }

  let format = "text";
  let files = argv.slice();
  let configPath: string | null = null;

  const formatIndex = files.indexOf("--format");
  if (formatIndex >= 0) {
    format = files[formatIndex + 1] || "text";
    files.splice(formatIndex, 2);
  }

  const configIndex = files.indexOf("--config");
  if (configIndex >= 0) {
    configPath = files[configIndex + 1] || null;
    files.splice(configIndex, 2);
  }

  files = files.filter((a) => !a.startsWith("-"));

  let config = {};
  if (configPath) {
    try {
      const configFileContent = fs.readFileSync(configPath, "utf8");
      config = JSON.parse(configFileContent);
    } catch (error) {
      console.error(`Error loading config file: ${error}`);
      process.exit(1);
    }
  }

  const rules = await loadRules();

  // Apply config to rules
  const enabledRules = rules.filter(rule => {
    return config?.rules?.[rule.id] !== false; // Enabled by default, unless explicitly disabled
  });

  if (files.length === 0) {
    // read from stdin
    const content = await readStdin();
    const issues = runRules(content, enabledRules);
    printIssues("stdin", issues, format);
    process.exit(issues.length > 0 ? 2 : 0);
  }

  let total = 0;
  for (const f of files) {
    if (!isAsciiDocFile(f) && !fs.existsSync(f)) {
      console.warn(`Skipping non-existent or non-asciidoc file: ${f}`);
      continue;
    }
    const content = readFileSyncUtf8(f);
    const issues = runRules(content, enabledRules);
    printIssues(f, issues, format);
    total += issues.length;
  }
  process.exit(total > 0 ? 2 : 0);
}

function printIssues(
  source: string,
  issues: { ruleId: string; message: string; line: number; column?: number }[],
  format: string
) {
  if (format === "json") {
    console.log(JSON.stringify({ source, issues }, null, 2));
    return;
  }
  if (issues.length === 0) {
    console.log(`${source}: OK`);
    return;
  }
  for (const it of issues) {
    console.log(
      `${source}:${it.line}:${it.column ?? 1}  ${it.ruleId}  ${it.message}`
    );
  }
}

// helper to run
if (import.meta.main) {
  main(process.argv.slice(2)).catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}
