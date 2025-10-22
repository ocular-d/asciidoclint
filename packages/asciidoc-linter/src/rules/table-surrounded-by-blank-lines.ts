import { Rule, Issue } from "../types.js";

const rule: Rule = {
  id: "table-surrounded-by-blank-lines",
  description:
    "Tables should be surrounded by blank lines and not stacked without separation",
  check(content: string) {
    const issues: Issue[] = [];
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === "|===") {
        // Opening table fence
        if (i > 0 && lines[i - 1].trim() !== "") {
          issues.push({
            ruleId: rule.id,
            message: "Table should be preceded by a blank line",
            line: i + 1,
            column: 1,
          });
        }

        // Find closing fence
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== "|===") {
          j++;
        }
        if (j < lines.length) {
          // Found closing fence
          if (j < lines.length - 1) {
            const nextLine = lines[j + 1].trim();
            if (nextLine !== "") {
              issues.push({
                ruleId: rule.id,
                message: "Table should be followed by a blank line",
                line: j + 1,
                column: 1,
              });
            }
            if (nextLine === "|===") {
              issues.push({
                ruleId: rule.id,
                message:
                  "Tables must be separated by a blank line, not stacked together",
                line: j + 2,
                column: 1,
              });
            }
          }
          // skip past closing fence
          i = j;
        }
      }
    }

    return issues;
  },
};

export default rule;

