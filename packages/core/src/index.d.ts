import { LintRule, LintResult, LintConfig } from './types';
export declare class AsciiDocLinter {
    private rules;
    private config;
    private asciidoc;
    constructor(config?: LintConfig);
    addRule(rule: LintRule): void;
    removeRule(ruleName: string): void;
    lintText(content: string, filename?: string): LintResult;
    lintFile(filepath: string): Promise<LintResult>;
}
export * from './types';
export { AsciiDocLinter as default };
//# sourceMappingURL=index.d.ts.map