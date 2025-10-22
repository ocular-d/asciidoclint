import { Rule, Issue } from '../types.js';


// A simple rule: Asciidoc headings should use `==` style for level-1 (no underline style)
const rule: Rule = {
id: 'heading-style-equals',
description: 'Prefer "==" style headings (e.g. "== Heading Two")',
check(content: string, config: any) {
const issues: Issue[] = [];
const lines = content.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
const line = lines[i];
// detect underlined headings (=== style is fine, but line below with === or --- underline is the other style)
if (/^[A-Za-z0-9].*$/u.test(line)) {
const next = lines[i + 1];
if (next && /^[-=]{2,}\s*$/.test(next)) {
issues.push({
ruleId: rule.id,
message: 'Underline style headings detected — prefer "== Heading" style where possible',
line: i + 1
});
}
}
}
return issues;
}
};


export default rule;