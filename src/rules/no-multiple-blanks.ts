import { Rule, Issue } from "../types.ts";

const rule: Rule = {
  id: "no-multiple-blanks",
  description: "Multiple consecutive blank lines should not occur",
  check(content: string) {
    const issues: Issue[] = [];
    const lines = content.split(/\r?\n/);

    let blankCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === "") {
        blankCount++;
        if (blankCount > 1) {
          issues.push({
            ruleId: rule.id,
            message: "Multiple consecutive blank lines",
            line: i + 1,
            column: 1,
          });
        }
      } else {
        blankCount = 0; // reset when hitting non-blank line
      }
    }

    return issues;
  },
};

export default rule;
