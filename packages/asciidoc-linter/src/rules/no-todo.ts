import { Rule, Issue } from "../types.js";

const rule: Rule = {
  id: "no-todo",
  description: "Do not leave TODO markers in documents",
  check(content: string) {
    const issues: Issue[] = [];
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes("TODO")) {
        issues.push({
          ruleId: rule.id,
          message: 'Found "TODO" marker — remove or resolve it',
          line: i + 1,
          column: line.indexOf("TODO") + 1
        });
      }
    }

    return issues;
  },
};

export default rule;
