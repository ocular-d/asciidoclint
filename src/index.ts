import { Rule, Issue } from "./types.ts";

export function runRules(
    content: string,
    rules: Rule[],
    config: Record<string, any>,
    path?: string
) {
    const all: Issue[] = [];

    for (const r of rules) {
        const ruleConfig = config[r.id];
        if (ruleConfig === false) {
            continue; // rule is disabled
        }
        const res = r.check(content, ruleConfig, path);
        if (res instanceof Promise) {
            throw new Error("Async rules not supported yet");
        }
        all.push(...res);
    }

    return filterDisabledIssues(content, all);
}

function filterDisabledIssues(content: string, issues: Issue[]): Issue[] {
    const lines = content.split(/\r?\n/);

    const disabledRanges: { from: number; to: number; ids: Set<string> | null }[] = [];
    const disableStack: { from: number; ids: Set<string> | null }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const lineNo = i + 1;
        const line = (lines[i] ?? "").trim();

        if (line.startsWith("// adoc-lint disable")) {
            const parts = line.split(/\s+/);
            const ids = parts.length > 2 ? new Set(parts.slice(2)) : null;
            disableStack.push({ from: lineNo + 1, ids });
        } else if (line.startsWith("// adoc-lint enable")) {
            if (disableStack.length === 0) continue;

            const lastDisable = disableStack.pop()!;
            const parts = line.split(/\s+/);
            const enableIds = parts.length > 2 ? new Set(parts.slice(2)) : null;

            // If enabling specific rules, we might need to split the disable range
            if (enableIds && lastDisable.ids) {
                const stillDisabled = new Set([...lastDisable.ids].filter(id => !enableIds.has(id)));
                const justEnabled = new Set([...lastDisable.ids].filter(id => enableIds.has(id)));

                if (justEnabled.size > 0) {
                    disabledRanges.push({ from: lastDisable.from, to: lineNo - 1, ids: justEnabled });
                }
                if (stillDisabled.size > 0) {
                    disableStack.push({ from: lastDisable.from, ids: stillDisabled });
                }
            } else {
                // Enabling all rules, or the disable was for all rules
                disabledRanges.push({ from: lastDisable.from, to: lineNo - 1, ids: lastDisable.ids });
            }
        }
    }

    // Add any remaining open disable ranges (to end of file)
    for (const openDisable of disableStack) {
        disabledRanges.push({ from: openDisable.from, to: lines.length, ids: openDisable.ids });
    }

    return issues.filter((iss) => {
        for (const r of disabledRanges) {
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
