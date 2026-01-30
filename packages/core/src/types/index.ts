export type Severity = 'error' | 'warning' | 'info';

export interface LintMessage {
  rule: string;
  message: string;
  severity: Severity;
  line?: number;
  column?: number;
  source?: string;
}

export interface LintResult {
  filename: string;
  messages: LintMessage[];
  errorCount: number;
  warningCount: number;
}

export interface LintContext {
  filename?: string;
  options: LintConfig;
}

export interface LintConfig {
  rules: Record<string, Severity | 'off' | any>;
}

export interface LintRule {
  name: string;
  description: string;
  severity: Severity;
  check(document: any, context: LintContext): LintMessage[];
}