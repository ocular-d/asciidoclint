import { Issue, Rule } from '../types.js';

type Config = { max: number } | boolean;

const RULE_NAME = 'heading-level';

const rule: Rule = {
  id: RULE_NAME,
  description: 'Enforce a maximum heading level.',
  check: (content: string, config: Config): Issue[] => {
    if (typeof config === 'boolean' && !config) {
      return [];
    }

    const issues: Issue[] = [];
    const maxLevel = typeof config === 'object' ? config.max : 3;
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(={2,6})\s/);
      if (!headingMatch) {
        continue;
      }

      const level = headingMatch[1].length - 1;

      if (level > maxLevel) {
        issues.push({
          ruleId: RULE_NAME,
          message: `Heading level ${level} is greater than the max allowed level of ${maxLevel}.`,
          line: i + 1,
          column: 1,
        });
      }
    }

    return issues;
  },
};

export default rule;