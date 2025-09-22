import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Rule } from "../types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rulesDir = path.join(__dirname);

export async function loadRules(): Promise<Rule[]> {
  const rules: Rule[] = [];
  const files = fs.readdirSync(rulesDir);

  for (const file of files) {
    if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
    if (file.startsWith("index.")) continue;

    const full = path.join(rulesDir, file);
    const mod = await import(pathToFileURL(full).href);
    const rule = mod.default;
    if (rule) rules.push(rule as Rule);
  }
  return rules;
}
