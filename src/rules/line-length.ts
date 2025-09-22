import { Rule, Issue } from '../types';


const MAX_LINE = 120;


const rule: Rule = {
id: 'line-length',
description: `Line should not exceed ${MAX_LINE} characters`,
check(content: string) {
const issues: Issue[] = [];
const lines = content.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
const l = lines[i];
if (l.length > MAX_LINE) {
issues.push({
ruleId: rule.id,
message: `Line longer than ${MAX_LINE} characters (${l.length})`,
line: i + 1,
column: MAX_LINE + 1
});
}
}
return issues;
}
};


export default rule;