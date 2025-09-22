import { Rule, Issue } from "./types.ts";

export function runRules(content: string, rules: Rule[]) {
    const all: Issue[] = [];

    for (const r of rules) {
        const res = r.check(content);
        if (res instanceof Promise) {
            throw new Error("Async rules not supported yet");
        }
        all.push(...res);
    }

    return filterDisabledIssues(content, all);
}

function filterDisabledIssues(content: string, issues: Issue[]): Issue[] {
    const lines = content.split(/\r?\n/);

    type Range = { from: number; to: number; ids: Set<string> | null };
    const ranges: Range[] = [];

    let currentFrom: number | null = null;
    let currentIds: Set<string> | null = null;

    for (let i = 0; i < lines.length; i++) {
        const lineNo = i + 1;
        const line = lines[i].trim();

        if (line.startsWith("// asciidoc-lint disable")) {
            // start disable from *next* line
            const parts = line.split(/\s+/);
            currentFrom = lineNo + 1;
            currentIds = parts.length > 2 ? new Set(parts.slice(2)) : null;
        } else if (line.startsWith("// asciidoc-lint enable")) {
            if (currentFrom !== null) {
                const parts = line.split(/\s+/);
                const to = lineNo - 1; // stop *before* enable line
                if (currentIds && parts.length > 2) {
                    // Only re-enable rules that are currently disabled
                    const enableIds = new Set(parts.slice(2));
                    const stillDisabled = new Set([...currentIds].filter(id => !enableIds.has(id)));
                    if (stillDisabled.size === 0) {
                        ranges.push({
                            from: currentFrom,
                            to,
                            ids: new Set(currentIds),
                        });
                        currentFrom = null;
                        currentIds = null;
                    } else {
                        ranges.push({
                            from: currentFrom,
                            to,
                            ids: new Set([...currentIds].filter(id => enableIds.has(id))),
                        });
                        currentIds = stillDisabled;
                        currentFrom = lineNo + 1;
                    }
                } else if (parts.length === 2 || currentIds === null) {
                    ranges.push({ from: currentFrom, to, ids: null });
                    currentFrom = null;
                    currentIds = null;
                }
            }
        }
    }

    // if still disabled at EOF
    if (currentFrom !== null) {
        ranges.push({ from: currentFrom, to: lines.length, ids: currentIds });
    }

    // filter issues
    return issues.filter((iss) => {
        for (const r of ranges) {
            if (iss.line >= r.from && iss.line <= r.to) {
                // all rules disabled
                if (r.ids === null) return false;
                // specific rule disabled
                if (r.ids.has(iss.ruleId)) return false;
            }
        }
        return true;
    });
}
