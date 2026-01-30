export interface LintRule {
    name: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
    check(document: any, context: LintContext): LintMessage[];
}
export interface LintMessage {
    rule: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    line?: number;
    column?: number;
    source?: string;
}
export interface LintContext {
    filename?: string;
    options: Record<string, any>;
}
export interface LintConfig {
    rules: Record<string, 'error' | 'warning' | 'info' | 'off'>;
    extends?: string[];
    plugins?: string[];
}
export interface LintResult {
    filename: string;
    messages: LintMessage[];
    errorCount: number;
    warningCount: number;
}
//# sourceMappingURL=types.d.ts.map