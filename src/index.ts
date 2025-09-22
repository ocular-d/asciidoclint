import { Rule, Issue } from './types';


export function runRules(content: string, rules: Rule[]) {
const all: Issue[] = [];
for (const r of rules) {
const res = r.check(content);
if (res instanceof Promise) {
throw new Error('Async rules are not supported in this minimal example');
}
all.push(...res);
}
return all;
}