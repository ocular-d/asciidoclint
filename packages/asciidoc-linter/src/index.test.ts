import { test, expect } from "vitest";
import { runRules } from "./index.js";
import lineLengthRule from "./rules/line-length.js";
import headingStyleRule from "./rules/heading-style.js";
import type { Rule } from "./types.js";

test("runRules should find multiple issues in content", () => {
    const content = `My Document
=========

This line is very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very long.`;

    const rules: Rule[] = [headingStyleRule, lineLengthRule];
    const config = {
        "heading-style-equals": true,
        "line-length": true, // use default 120
    };

    const issues = runRules(content, rules, config);

    expect(issues.length).toBe(2);

    const headingIssue = issues.find(i => i.ruleId === 'heading-style-equals');
    expect(headingIssue).toBeDefined();
    expect(headingIssue?.line).toBe(1);

    const lineLengthIssue = issues.find(i => i.ruleId === 'line-length');
    expect(lineLengthIssue).toBeDefined();
    expect(lineLengthIssue?.line).toBe(4);
    expect(lineLengthIssue?.message).toContain("120");
});

test("runRules should respect rule configuration", () => {
    const content = `This line is more than 30 characters long.`;
    const rules: Rule[] = [lineLengthRule];
    const config = {
        "line-length": { max: 30 },
    };

    const issues = runRules(content, rules, config);

    expect(issues.length).toBe(1);
    expect(issues[0].ruleId).toBe("line-length");
    expect(issues[0].message).toContain("longer than 30 characters");
});

test("runRules should respect disabling rules via comments", () => {
    const content = `My Document
=========

// adoc-lint disable line-length
This line is very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very long.
// adoc-lint enable line-length

This next line is also very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very long.`;

    const rules: Rule[] = [headingStyleRule, lineLengthRule];
    const config = {
        "heading-style-equals": true,
        "line-length": { max: 80 },
    };

    const issues = runRules(content, rules, config);

    expect(issues.length).toBe(2); // heading-style + one line-length
    expect(issues.some(i => i.ruleId === 'line-length' && i.line === 5)).toBe(false);
    expect(issues.some(i => i.ruleId === 'line-length' && i.line === 8)).toBe(true);
});