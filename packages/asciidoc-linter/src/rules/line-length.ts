import { Rule, Issue } from '../types.js';


const DEFAULT_MAX_LINE = 120;

const rule: Rule = {
  id: 'line-length',
  description: `Line should not exceed a configured maximum length (default: ${DEFAULT_MAX_LINE}).`,
  check(content: string, config: any, path?: string) {
    const issues: Issue[] = [];

    let maxLine = DEFAULT_MAX_LINE;
    if (typeof config === 'object' && config !== null && typeof config.max === 'number') {
      maxLine = config.max;
    }

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.length > maxLine) {
        issues.push({
          ruleId: rule.id,
          message: `Line longer than ${maxLine} characters (${l.length})`,
          line: i + 1,
          column: maxLine + 1
        });
      }
    }
    return issues;
  }
};


export default rule;