import asciidoctor from '@asciidoctor/core';
import Debug from 'debug';
import { LintRule, LintContext, LintResult, LintMessage, LintConfig } from './types/index';

const debug = Debug('asciidoclint:core');

export class AsciiDocLinter {
  private rules: Map<string, LintRule> = new Map();
  private config: LintConfig;
  private asciidoc = asciidoctor();

  constructor(config: LintConfig = { rules: {} }) {
    this.config = config;
    debug('Linter initialized with config: %O', config);
  }

  addRule(rule: LintRule): void {
    this.rules.set(rule.name, rule);
    debug('Added rule: %s', rule.name);
  }

  removeRule(ruleName: string): void {
    this.rules.delete(ruleName);
    debug('Removed rule: %s', ruleName);
  }

  lintText(content: string, filename?: string): LintResult {
    debug('Linting content for file: %s', filename || 'unnamed');
    
    const document = this.asciidoc.load(content);
    const context: LintContext = {
      filename,
      options: this.config
    };

    const messages: LintMessage[] = [];
    let errorCount = 0;
    let warningCount = 0;

    for (const [ruleName, rule] of this.rules) {
      const ruleConfig = this.config.rules[ruleName];
      
      if (ruleConfig === 'off') {
        continue;
      }

      try {
        const ruleMessages = rule.check(document, context);
        
        for (const message of ruleMessages) {
          // Override severity based on config
          const severity = ruleConfig || rule.severity;
          const lintMessage: LintMessage = {
            ...message,
            severity
          };

          messages.push(lintMessage);

          if (severity === 'error') {
            errorCount++;
          } else if (severity === 'warning') {
            warningCount++;
          }
        }
      } catch (error) {
        debug('Error running rule %s: %O', ruleName, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        messages.push({
          rule: ruleName,
          message: `Rule error: ${errorMessage}`,
          severity: 'error'
        });
        errorCount++;
      }
    }

    const result: LintResult = {
      filename: filename || 'unnamed',
      messages,
      errorCount,
      warningCount
    };

    debug('Linting complete. Errors: %d, Warnings: %d', errorCount, warningCount);
    return result;
  }

  async lintFile(filepath: string): Promise<LintResult> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filepath, 'utf8');
    return this.lintText(content, filepath);
  }
}

export * from './types/index';
export { AsciiDocLinter as default };