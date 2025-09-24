import { Rule, Issue } from "../types.ts";

const rule: Rule = {
  id: "heading-surrounded-by-blank-lines",
  description:
    "Headings should be surrounded by blank lines (except level 1 headings)",
  check(content: string) {
    const issues: Issue[] = [];
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // match AsciiDoc headings (==, ===, etc.)
      const match = line.match(/^(=+)\s+/);
      if (!match) continue;

      const level = match[1].length;

      // Skip level 1 (= Title)
      if (level === 1) continue;

      const prevLine = i > 0 ? lines[i - 1].trim() : "";
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : "";

      // Missing blank line before heading
      if (prevLine !== "" && !prevLine.startsWith("//")) {
        issues.push({
          ruleId: rule.id,
          message: "Heading should be preceded by a blank line",
          line: i + 1,
          column: 1,
        });
      }

      // Missing blank line after heading
      if (nextLine !== "" && !nextLine.startsWith("//")) {
        issues.push({
          ruleId: rule.id,
          message: "Heading should be followed by a blank line",
          line: i + 1,
          column: 1,
        });
      }
    }

    return issues;
  },
};

export default rule;
